const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const matter = require('front-matter');

async function build() {
    // Create dist directory
    await fs.ensureDir('dist');
    
    // Copy assets
    await fs.copy('src/assets', 'dist/assets');
    
    // Copy index.html
    if (await fs.pathExists('src/index.html')) {
        await fs.copy('src/index.html', 'dist/index.html');
    }
    
    // Build pages
    const pagesDir = 'src/content/pages';
    const pages = await fs.readdir(pagesDir);
    
    for (const page of pages) {
        if (page.endsWith('.md')) {
            const content = await fs.readFile(path.join(pagesDir, page), 'utf-8');
            const { attributes, body } = matter(content);
            const html = marked(body);
            
            // Use template for all markdown pages
            const template = await fs.readFile('src/templates/page.html', 'utf-8');
            const finalHtml = template
                .replace('{{title}}', attributes.title || 'Page')
                .replace('{{content}}', html);
                
            const outputPath = path.join('dist', page.replace('.md', '.html'));
            await fs.writeFile(outputPath, finalHtml);
        }
    }
}

build().catch(console.error); 