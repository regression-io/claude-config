const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ClaudeConfigManager = require('../config-loader.js');

describe('ClaudeConfigManager', () => {
  let manager;
  let tempDir;

  before(() => {
    manager = new ClaudeConfigManager();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-config-test-'));
  });

  after(() => {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('loadJson', () => {
    it('should return null for non-existent file', () => {
      const result = manager.loadJson('/nonexistent/path.json');
      assert.strictEqual(result, null);
    });

    it('should load valid JSON file', () => {
      const testPath = path.join(tempDir, 'test.json');
      fs.writeFileSync(testPath, JSON.stringify({ test: 'value' }));

      const result = manager.loadJson(testPath);
      assert.deepStrictEqual(result, { test: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const testPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(testPath, 'not valid json');

      const result = manager.loadJson(testPath);
      assert.strictEqual(result, null);
    });
  });

  describe('saveJson', () => {
    it('should save JSON with formatting', () => {
      const testPath = path.join(tempDir, 'save-test.json');
      const data = { key: 'value', nested: { a: 1 } };

      manager.saveJson(testPath, data);

      const content = fs.readFileSync(testPath, 'utf8');
      assert.ok(content.includes('\n')); // Should be formatted
      assert.deepStrictEqual(JSON.parse(content), data);
    });
  });

  describe('loadEnvFile', () => {
    it('should return empty object for non-existent file', () => {
      const result = manager.loadEnvFile('/nonexistent/.env');
      assert.deepStrictEqual(result, {});
    });

    it('should parse simple key=value pairs', () => {
      const envPath = path.join(tempDir, '.env');
      fs.writeFileSync(envPath, 'KEY1=value1\nKEY2=value2');

      const result = manager.loadEnvFile(envPath);
      assert.deepStrictEqual(result, { KEY1: 'value1', KEY2: 'value2' });
    });

    it('should ignore comments', () => {
      const envPath = path.join(tempDir, '.env-comments');
      fs.writeFileSync(envPath, '# comment\nKEY=value\n# another comment');

      const result = manager.loadEnvFile(envPath);
      assert.deepStrictEqual(result, { KEY: 'value' });
    });

    it('should strip quotes from values', () => {
      const envPath = path.join(tempDir, '.env-quotes');
      fs.writeFileSync(envPath, 'SINGLE=\'quoted\'\nDOUBLE="quoted"');

      const result = manager.loadEnvFile(envPath);
      assert.deepStrictEqual(result, { SINGLE: 'quoted', DOUBLE: 'quoted' });
    });

    it('should handle values with = signs', () => {
      const envPath = path.join(tempDir, '.env-equals');
      fs.writeFileSync(envPath, 'URL=postgres://host?key=val');

      const result = manager.loadEnvFile(envPath);
      assert.deepStrictEqual(result, { URL: 'postgres://host?key=val' });
    });
  });

  describe('interpolate', () => {
    it('should replace ${VAR} with env values', () => {
      const env = { TOKEN: 'secret123' };
      const result = manager.interpolate('Bearer ${TOKEN}', env);
      assert.strictEqual(result, 'Bearer secret123');
    });

    it('should handle nested objects', () => {
      const env = { HOST: 'localhost', PORT: '3000' };
      const obj = { url: 'http://${HOST}:${PORT}', nested: { path: '${HOST}' } };

      const result = manager.interpolate(obj, env);
      assert.deepStrictEqual(result, {
        url: 'http://localhost:3000',
        nested: { path: 'localhost' }
      });
    });

    it('should handle arrays', () => {
      const env = { ARG: 'test' };
      const arr = ['${ARG}', 'static', '${ARG}2'];

      const result = manager.interpolate(arr, env);
      assert.deepStrictEqual(result, ['test', 'static', 'test2']);
    });

    it('should leave unmatched vars unchanged', () => {
      const result = manager.interpolate('${UNDEFINED}', {});
      assert.strictEqual(result, '${UNDEFINED}');
    });

    it('should pass through non-string primitives', () => {
      assert.strictEqual(manager.interpolate(42, {}), 42);
      assert.strictEqual(manager.interpolate(true, {}), true);
      assert.strictEqual(manager.interpolate(null, {}), null);
    });
  });

  describe('findProjectRoot', () => {
    it('should find directory with .claude folder', () => {
      const projectDir = path.join(tempDir, 'project-root');
      const claudeDir = path.join(projectDir, '.claude');
      const subDir = path.join(projectDir, 'src', 'deep');

      fs.mkdirSync(claudeDir, { recursive: true });
      fs.mkdirSync(subDir, { recursive: true });

      const result = manager.findProjectRoot(subDir);
      assert.strictEqual(result, projectDir);
    });

    it('should return null if no .claude folder found', () => {
      const noClaudeDir = path.join(tempDir, 'no-claude');
      fs.mkdirSync(noClaudeDir, { recursive: true });

      const result = manager.findProjectRoot(noClaudeDir);
      assert.strictEqual(result, null);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge include arrays without duplicates', () => {
      const configs = [
        { config: { include: ['github', 'filesystem'] } },
        { config: { include: ['github', 'postgres'] } }
      ];

      const result = manager.mergeConfigs(configs);
      assert.deepStrictEqual(result.include, ['github', 'filesystem', 'postgres']);
    });

    it('should override mcpServers from child configs', () => {
      const configs = [
        { config: { mcpServers: { custom: { command: 'old' } } } },
        { config: { mcpServers: { custom: { command: 'new' } } } }
      ];

      const result = manager.mergeConfigs(configs);
      assert.deepStrictEqual(result.mcpServers, { custom: { command: 'new' } });
    });

    it('should take most specific template', () => {
      const configs = [
        { config: { template: 'base' } },
        { config: { template: 'specific' } }
      ];

      const result = manager.mergeConfigs(configs);
      assert.strictEqual(result.template, 'specific');
    });

    it('should handle null configs gracefully', () => {
      const configs = [
        { config: null },
        { config: { include: ['github'] } }
      ];

      const result = manager.mergeConfigs(configs);
      assert.deepStrictEqual(result.include, ['github']);
    });
  });
});

describe('Integration', () => {
  let manager;
  let testProjectDir;

  before(() => {
    manager = new ClaudeConfigManager();
    testProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-config-integration-'));
  });

  after(() => {
    fs.rmSync(testProjectDir, { recursive: true, force: true });
  });

  it('should initialize a project and create config files', () => {
    // Save original cwd
    const originalCwd = process.cwd();
    process.chdir(testProjectDir);

    try {
      manager.init(testProjectDir);

      // Check .claude directory was created
      assert.ok(fs.existsSync(path.join(testProjectDir, '.claude')));

      // Check mcps.json was created
      const configPath = path.join(testProjectDir, '.claude', 'mcps.json');
      assert.ok(fs.existsSync(configPath));

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(Array.isArray(config.include));
      assert.ok(config.include.includes('github'));
      assert.ok(config.include.includes('filesystem'));
    } finally {
      process.chdir(originalCwd);
    }
  });
});
