const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const matter = require('front-matter');

async function build() {
    // Load templates
    const headerTemplate = await fs.readFile('src/templates/partials/header.html', 'utf-8');
    const footerTemplate = await fs.readFile('src/templates/partials/footer.html', 'utf-8');
    const convertkitTemplate = await fs.readFile('src/templates/partials/convertkit.html', 'utf-8');
    const pageTemplate = await fs.readFile('src/templates/page.html', 'utf-8');
    const blogTemplate = await fs.readFile('src/templates/blog.html', 'utf-8');

    // Helper function to apply templates
    function applyTemplate(template, data) {
        let result = template
            .replace('{{header}}', headerTemplate.replace('{{title}}', data.title || 'Page'))
            .replace('{{footer}}', footerTemplate)
            .replace('{{convertkit}}', convertkitTemplate);
        
        // Replace remaining template variables
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, data[key] || '');
        });
        
        return result;
    }

    // Create dist directory
    await fs.ensureDir('dist');
    await fs.ensureDir('dist/blog');
    
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
            
            const finalHtml = applyTemplate(pageTemplate, {
                title: attributes.title || 'Page',
                content: html
            });
                
            const outputPath = path.join('dist', page.replace('.md', '.html'));
            await fs.writeFile(outputPath, finalHtml);
        }
    }

    // Build blog posts
    const blogDir = 'src/content/blog';
    const posts = await fs.readdir(blogDir);
    const blogPosts = [];

    for (const post of posts) {
        if (post.endsWith('.md')) {
            const content = await fs.readFile(path.join(blogDir, post), 'utf-8');
            const { attributes, body } = matter(content);
            const html = marked(body);
            
            blogPosts.push({
                title: attributes.title,
                date: attributes.date,
                author: attributes.author,
                slug: post.replace('.md', ''),
                excerpt: body.split('\n')[0]
            });
            
            const finalHtml = applyTemplate(blogTemplate, {
                title: `${attributes.title} | Blog`,
                date: attributes.date,
                author: attributes.author,
                content: html
            });
                
            const outputPath = path.join('dist/blog', post.replace('.md', '.html'));
            await fs.writeFile(outputPath, finalHtml);
        }
    }

    // Sort and build blog index
    blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const blogIndexHtml = applyTemplate(pageTemplate, {
        title: 'Blog',
        content: `
            <div class="blog-index">
                <h1>Blog Posts</h1>
                ${blogPosts.map(post => `
                    <article class="blog-preview">
                        <h2><a href="/blog/${post.slug}.html">${post.title}</a></h2>
                        <div class="post-meta">
                            <time>${post.date}</time>
                            ${post.author ? `<span class="author">by ${post.author}</span>` : ''}
                        </div>
                        <p>${post.excerpt}</p>
                    </article>
                `).join('')}
            </div>
        `
    });
    
    await fs.writeFile('dist/blog.html', blogIndexHtml);

    // Add a check for the convertkit template
    try {
        const convertkitTemplate = await fs.readFile('src/templates/partials/convertkit.html', 'utf-8');
        console.log('Found ConvertKit template');
    } catch (err) {
        console.error('Error loading ConvertKit template:', err);
    }
}

build().catch(console.error); 