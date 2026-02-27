# Deployment Guide

## Pre-Deployment Checklist

- [ ] All pages tested locally
- [ ] Links verified and working
- [ ] Images optimized and paths correct
- [ ] Meta tags updated for SEO
- [ ] Analytics code configured
- [ ] Contact form tested
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility checked
- [ ] Performance optimized
- [ ] Security headers configured

---

## Deployment Options

### 1. Vercel (Recommended)

**Pros:**
- Easy GitHub integration
- Automatic deployments
- Free tier available
- Global CDN
- SSL included

**Steps:**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import GitHub repository
5. Configure project settings
6. Deploy

**Connect custom domain:**
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records at registrar

---

### 2. Netlify

**Pros:**
- Simple deployment
- Form handling built-in
- Serverless functions available
- Global CDN

**Steps:**
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Connect GitHub account
5. Select repository
6. Set build settings (leave empty for static site)
7. Deploy

**Configure contact form:**
1. Add `netlify` attribute to form
2. Form submissions automatically handled
3. Configure notifications in Site Settings

---

### 3. GitHub Pages

**Pros:**
- Free
- Integrated with GitHub
- Simple setup
- Good for static content

**Steps:**
1. Go to repository Settings
2. Scroll to "GitHub Pages" section
3. Select main branch as source
4. Save
5. Site deploys to `username.github.io/repo-name`

**Custom domain:**
1. Add CNAME file to root
2. Update DNS settings at registrar

---

### 4. Traditional Hosting (cPanel/FTP)

**Steps:**
1. Connect via FTP/SFTP using credentials from host
2. Upload files to public_html folder
3. Verify uploading worked
4. Test site in browser

**FTP Tools:**
- FileZilla (free)
- Cyberduck (free)
- WinSCP (free)

---

## Post-Deployment Tasks

1. **Verify Website**
   - Visit domain
   - Test all pages
   - Check links
   - Verify contact form
   - Test analytics

2. **Search Engine Optimization**
   - Submit sitemap to Google Search Console
   - Submit sitemap to Bing Webmaster Tools
   - Check search console for errors
   - Monitor indexing status

3. **Security**
   - Enable SSL/HTTPS (automatic with most services)
   - Set security headers
   - Configure robots.txt
   - Monitor security logs

4. **Performance**
   - Run Google PageSpeed Insights
   - Check Core Web Vitals
   - Monitor loading times
   - Optimize images if needed

5. **Monitoring**
   - Set up Google Analytics
   - Set up uptime monitoring
   - Configure error tracking
   - Monitor traffic patterns

---

## Continuous Deployment Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Environment Configuration

### Production URLs
- **Main Site:** https://compassconsult.co.uk
- **Staging:** https://staging.compassconsult.co.uk (optional)

### DNS Records

```
Type    Name        Value
A       @           [IP Address]
CNAME   www         [Provider CNAME]
MX      @           [Mail Server]
TXT     @           [SPF Record]
```

---

## SSL/HTTPS Configuration

Most modern hosting provides automatic SSL:
- **Vercel/Netlify:** Automatic
- **cPanel:** AutoSSL (usually enabled)
- **GitHub Pages:** Automatic with custom domain

To enforce HTTPS, add redirect (varies by host):
```
# .htaccess (Apache)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Backup Strategy

### Schedule Regular Backups
1. Daily: Database (if applicable)
2. Weekly: Full website backup
3. Monthly: Archive to external storage

### Backup Methods
- FTP download entire site
- Use hosting provider's backup tools
- Use version control (Git)
- Third-party backup services

---

## Performance Optimization

### Image Optimization
```bash
# Using ImageMagick
convert image.jpg -quality 85 -resize 1200x image-optimized.jpg

# Or use online tools:
# - TinyPNG
# - ImageOptim
# - Squoosh
```

### Enable Caching
- Browser caching: 1 year for static assets
- Server caching: Configure on hosting provider
- CDN caching: Automatic with most providers

---

## Monitoring & Analytics

### Essential Tools
1. **Google Analytics 4**
   - Track visitor behavior
   - Monitor conversion goals
   - Analyze user flows

2. **Google Search Console**
   - Monitor search performance
   - Fix indexing issues
   - Track rankings

3. **Uptime Monitoring**
   - UptimeRobot (free)
   - Pingdom
   - StatusCake

4. **Error Tracking**
   - Sentry
   - Rollbar
   - Datadog

---

## Troubleshooting Deployment

### Site Not Loading
- [ ] Check DNS is pointing to correct IP
- [ ] Verify files were uploaded correctly
- [ ] Check .htaccess for redirects
- [ ] Look for 404/500 errors in logs

### Slow Performance
- [ ] Optimize images
- [ ] Enable gzip compression
- [ ] Minify CSS/JavaScript
- [ ] Use CDN
- [ ] Check hosting resources

### Forms Not Working
- [ ] Verify form endpoints
- [ ] Check email configuration
- [ ] Test email delivery
- [ ] Check spam filters

### SSL Certificate Issues
- [ ] Verify certificate is valid
- [ ] Check certificate expiration
- [ ] Force HTTPS redirect
- [ ] Clear browser cache

---

## Rollback Procedure

If deployment goes wrong:

1. **Immediate Actions**
   - Identify the problem
   - Notify stakeholders
   - Switch to previous version

2. **Rollback Steps**
   ```bash
   # Using Git
   git revert [commit-hash]
   git push origin main
   
   # Using Vercel/Netlify
   # Go to deployments and click "Rollback"
   
   # Using FTP
   # Re-upload previous version of files
   ```

3. **Investigation**
   - Identify what caused the issue
   - Fix in development
   - Test thoroughly
   - Re-deploy

---

## What to Document

- Deployment credentials (secure storage)
- DNS configuration details
- SSL certificate info
- Custom domain setup
- Email configuration
- API keys and secrets (in secure vault)
- Monitoring dashboards
- Backup schedules

---

## Support Resources

- **Vercel Support:** https://vercel.com/support
- **Netlify Support:** https://netlify.com/support
- **GitHub Pages:** https://docs.github.com/pages
- **Hosting Provider:** Check your account dashboard

---

**Last Updated:** 15 February 2026  
**Created By:** Zenith IT
