#!/usr/bin/env node

/**
 * 版本管理脚本
 *
 * 功能：
 * - 根据版本类型自动递增版本号
 * - 更新 package.json 中的版本号
 * - 输出新版本号供 CI 使用
 *
 * 使用方式：
 * node scripts/bump-version.js [major|minor|patch]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');

// 获取版本类型参数
const versionType = process.argv[2] || 'patch';

/**
 * 解析版本号为对象
 * @param {string} version - 版本字符串，如 "1.2.3"
 * @returns {{major: number, minor: number, patch: number}}
 */
function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

/**
 * 将版本对象转换为字符串
 * @param {{major: number, minor: number, patch: number}} version
 * @returns {string}
 */
function stringifyVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * 根据类型递增版本号
 * @param {string} currentVersion - 当前版本号
 * @param {string} type - 版本类型: major | minor | patch
 * @returns {string} - 新版本号
 */
function bumpVersion(currentVersion, type) {
  const version = parseVersion(currentVersion);

  switch (type) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      break;
    case 'patch':
    default:
      version.patch += 1;
      break;
  }

  return stringifyVersion(version);
}

/**
 * 主函数
 */
function main() {
  try {
    // 读取 package.json
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    const currentVersion = packageJson.version;

    // 计算新版本号
    const newVersion = bumpVersion(currentVersion, versionType);

    // 更新 package.json
    packageJson.version = newVersion;

    // 写回文件
    fs.writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf-8'
    );

    // 输出新版本号（供 CI 使用）
    console.log(newVersion);

    // 在 stderr 中输出详细信息
    console.error(`版本更新: ${currentVersion} → ${newVersion} (${versionType})`);
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main();
