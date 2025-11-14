const fs = require('fs');
const axios = require('axios');

const username = 'nellyndungu'; // 
const readmePath = './README.md';
const token = process.env.GITHUB_TOKEN; 

async function getRepos() {
  const res = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, {
    headers: { Authorization: `token ${token}` }
  });
  return res.data;
}

async function getLanguages(repo) {
  const res = await axios.get(repo.languages_url, {
    headers: { Authorization: `token ${token}` }
  });
  return res.data;
}

(async () => {
  try {
    const repos = await getRepos();
    const languageTotals = {};

    for (const repo of repos) {
      const languages = await getLanguages(repo);
      for (const [lang, bytes] of Object.entries(languages)) {
        languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
      }
    }

    const totalBytes = Object.values(languageTotals).reduce((a, b) => a + b, 0);
    const languagePercentages = Object.entries(languageTotals)
      .map(([lang, bytes]) => ({ lang, percentage: ((bytes / totalBytes) * 100).toFixed(2) }))
      .sort((a, b) => b.percentage - a.percentage);

    // Build Markdown table
    let markdown = '### 📝 Languages Used Across All Repos\n\n';
    markdown += '| Language | % |\n| --- | --- |\n';
    languagePercentages.forEach(l => {
      markdown += `| ${l.lang} | ${l.percentage}% |\n`;
    });

    // Update README between markers
    const start = '<!-- LANGUAGES-START -->';
    const end = '<!-- LANGUAGES-END -->';

    let readme = fs.readFileSync(readmePath, 'utf8');
    const regex = new RegExp(`${start}[\\s\\S]*${end}`, 'm');

    if (regex.test(readme)) {
      readme = readme.replace(regex, `${start}\n${markdown}\n${end}`);
    } else {
      readme += `\n${start}\n${markdown}\n${end}`;
    }

    fs.writeFileSync(readmePath, readme);
    console.log('README updated with language stats!');
  } catch (error) {
    console.error(error);
  }
})();
