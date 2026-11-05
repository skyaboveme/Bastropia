<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Bastropia sitemap</title>
        <style>
          :root { color-scheme: light; }
          body { margin: 0; font: 16px/1.45 system-ui, sans-serif; color: #1a1a1a; background: #f7f4ef; }
          main { max-width: 52rem; margin: 0 auto; padding: 2rem 1.2rem 3rem; }
          h1 { font-size: 1.6rem; margin: 0 0 0.4rem; }
          p { color: #4a453c; margin: 0 0 1.2rem; }
          .count { font-weight: 600; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd4c6; }
          th, td { text-align: left; padding: 0.55rem 0.7rem; border-bottom: 1px solid #eee6da; vertical-align: top; }
          th { font-size: 0.78rem; letter-spacing: 0.04em; text-transform: uppercase; color: #6a6358; background: #faf7f2; }
          a { color: #0b5f4b; word-break: break-all; }
          td.meta { white-space: nowrap; color: #6a6358; font-variant-numeric: tabular-nums; }
        </style>
      </head>
      <body>
        <main>
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <h1>Sitemap index</h1>
              <p>This file points Google at the full URL list. Open the link below.</p>
              <table>
                <thead><tr><th>Sitemap</th></tr></thead>
                <tbody>
                  <xsl:for-each select="s:sitemapindex/s:sitemap">
                    <tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td></tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <h1>Bastropia sitemap</h1>
              <p>
                <span class="count"><xsl:value-of select="count(s:urlset/s:url)"/></span>
                public pages for search engines. Submit
                <a href="https://bastropia.com/sitemap.xml">https://bastropia.com/sitemap.xml</a>
                in Google Search Console.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Last mod</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="s:urlset/s:url">
                    <tr>
                      <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                      <td class="meta"><xsl:value-of select="s:lastmod"/></td>
                      <td class="meta"><xsl:value-of select="s:priority"/></td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
