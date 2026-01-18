/**
 * Search Routes (GitHub, npm)
 */

const https = require('https');

/**
 * Infer MCP args from GitHub repo
 */
function inferMcpArgs(repo) {
  const name = repo.name.toLowerCase();
  const fullName = repo.full_name.toLowerCase();

  // Check for official MCP packages
  if (fullName.includes('modelcontextprotocol/servers')) {
    const serverName = name.replace('server-', '');
    return ['-y', `@modelcontextprotocol/server-${serverName}`];
  }

  // Check for npm-style package names
  if (repo.topics && repo.topics.includes('npm')) {
    return ['-y', repo.full_name];
  }

  // Default to running from GitHub
  return ['-y', `github:${repo.full_name}`];
}

/**
 * Search GitHub for MCP servers
 */
async function searchGithub(query) {
  if (!query) {
    return { results: [], error: 'Query required' };
  }

  const searchQuery = encodeURIComponent(`${query} mcp server in:name,description,topics`);
  const url = `https://api.github.com/search/repositories?q=${searchQuery}&per_page=20&sort=stars`;

  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'claude-config-ui/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.message) {
            resolve({ results: [], error: parsed.message });
            return;
          }
          const results = (parsed.items || []).map(repo => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            topics: repo.topics || [],
            suggestedCommand: 'npx',
            suggestedArgs: inferMcpArgs(repo)
          }));
          resolve({ results });
        } catch (e) {
          resolve({ results: [], error: e.message });
        }
      });
    });
    req.on('error', (e) => resolve({ results: [], error: e.message }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ results: [], error: 'Request timeout' });
    });
  });
}

/**
 * Search npm for MCP packages
 */
async function searchNpm(query) {
  if (!query) {
    return { results: [], error: 'Query required' };
  }

  const searchQuery = encodeURIComponent(`${query} mcp`);
  const url = `https://registry.npmjs.org/-/v1/search?text=${searchQuery}&size=20`;

  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const results = (parsed.objects || []).map(obj => ({
            name: obj.package.name,
            description: obj.package.description,
            version: obj.package.version,
            url: `https://www.npmjs.com/package/${obj.package.name}`,
            keywords: obj.package.keywords || [],
            suggestedCommand: 'npx',
            suggestedArgs: ['-y', obj.package.name]
          }));
          resolve({ results });
        } catch (e) {
          resolve({ results: [], error: e.message });
        }
      });
    });
    req.on('error', (e) => resolve({ results: [], error: e.message }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ results: [], error: 'Request timeout' });
    });
  });
}

module.exports = {
  searchGithub,
  searchNpm,
  inferMcpArgs,
};
