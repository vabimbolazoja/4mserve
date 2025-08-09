import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renderTemplate = (data = {}) => {
  const templatePath = path.join(__dirname, 'templates', 'emailTemplate.html');
  let template = readFileSync(templatePath, 'utf8');

  for (const key in data) {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(pattern, data[key]);
  }

  return template;
};

export default renderTemplate;
