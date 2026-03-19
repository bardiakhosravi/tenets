const fs = require('node:fs');
const path = require('node:path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function writeSeparateFiles(targetDir, { introduction, sections }, fileExtension) {
  ensureDir(targetDir);

  const introName = `00-introduction${fileExtension}`;
  fs.writeFileSync(path.join(targetDir, introName), introduction, 'utf-8');

  const writtenFiles = [introName];

  for (const section of sections) {
    const sectionDir = path.join(targetDir, section.section.toLowerCase());
    ensureDir(sectionDir);

    for (const file of section.files) {
      const fileName = slugify(file.title) + fileExtension;
      const filePath = path.join(sectionDir, fileName);
      fs.writeFileSync(filePath, file.content, 'utf-8');
      writtenFiles.push(`${section.section.toLowerCase()}/${fileName}`);
    }
  }

  return writtenFiles;
}

module.exports = { writeSeparateFiles };
