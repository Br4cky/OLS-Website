/**
 * LEAGUE TABLE SCRAPER - OLS 132 (Puppeteer Version)
 * Uses headless browser to navigate RFU site and scrape JavaScript-rendered tables
 * 
 * Required packages:
 *   npm install @sparticuz/chromium puppeteer-core
 * 
 * Required netlify.toml config:
 *   [functions]
 *     external_node_modules = ["@sparticuz/chromium"]
 *   [functions."league-table"]
 *     memory = 1024
 */

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Cache Map - stores multiple leagues independently
const cacheMap = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let browser = null;

    try {
        const params = event.queryStringParameters || {};
        const team = params.team || '15791'; // Default to Men's 1st
        const season = params.season || '2025-2026';
        const division = params.division || '';
        const competition = params.competition || '';
        const tableIndex = parseInt(params.tableIndex) || 0;
        const discover = params.discover === 'true';

        // Build cache key
        const cacheKey = division && competition 
            ? `${team}-${division}-${competition}-${season}${tableIndex ? `-t${tableIndex}` : ''}`
            : `team-${team}-${season}${tableIndex ? `-t${tableIndex}` : ''}`;

        // Check cache (skip for discover mode)
        if (!discover) {
            const now = Date.now();
            const cached = cacheMap.get(cacheKey);
            if (cached && (now - cached.timestamp) < CACHE_TTL) {
                console.log('✅ Returning cached data for:', cacheKey);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        cached: true,
                        cacheKey,
                        data: cached.data
                    })
                };
            }
        }

        console.log('🚀 Launching Puppeteer for team:', team);

        // Launch browser
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Step 1: Go to team page
        const teamUrl = `https://www.englandrugby.com/fixtures-and-results/search-results?team=${team}&season=${season}`;
        console.log('📍 Step 1: Navigating to team page:', teamUrl);
        await page.goto(teamUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Step 2: Click "Tables" tab
        console.log('📍 Step 2: Clicking Tables tab...');
        await page.waitForSelector('button, a, [role="tab"]', { timeout: 10000 });
        
        // Try to find and click the Tables tab
        const tablesClicked = await page.evaluate(() => {
            // Look for tabs/buttons containing "Tables" text
            const elements = document.querySelectorAll('button, a, [role="tab"], .tab, [data-tab]');
            for (const el of elements) {
                if (el.textContent.toLowerCase().includes('table')) {
                    el.click();
                    return true;
                }
            }
            return false;
        });

        if (tablesClicked) {
            console.log('✅ Tables tab clicked');
            await new Promise(r => setTimeout(r, 2000)); // Wait for content to load
        } else {
            console.log('⚠️ Tables tab not found, continuing...');
        }

        // Step 3: Handle discovery vs fetch mode
        console.log('📍 Step 3: Processing tables...');
        
        if (discover) {
            // DISCOVERY MODE: Find all table previews and their "View Full Table" links
            console.log('🔍 Discovery mode - scanning available tables...');
            
            const tableInfo = await page.evaluate(() => {
                const results = [];
                
                // Find all table sections/cards on the page
                // Look for table containers that have both a preview table and a "View Full Table" link
                const viewFullLinks = Array.from(document.querySelectorAll('a, button')).filter(el => 
                    el.textContent.toLowerCase().includes('view full table') || 
                    el.textContent.toLowerCase().includes('full table')
                );
                
                viewFullLinks.forEach((link, index) => {
                    // Try to find the parent container and extract info
                    let container = link.closest('section, .card, .table-container, div[class*="table"], div[class*="league"]') || link.parentElement?.parentElement?.parentElement;
                    
                    // Look for a heading/title near this link
                    let title = 'Unknown Table';
                    const headings = container?.querySelectorAll('h1, h2, h3, h4, h5, .title, [class*="title"], [class*="heading"]');
                    if (headings && headings.length > 0) {
                        title = headings[0].textContent.trim();
                    }
                    
                    // Try to get preview teams from the small table near this link
                    const previewTable = container?.querySelector('table');
                    const previewTeams = [];
                    if (previewTable) {
                        previewTable.querySelectorAll('tbody tr').forEach((row, rowIdx) => {
                            if (rowIdx < 3) {
                                const cells = row.querySelectorAll('td');
                                if (cells.length >= 2) {
                                    const teamName = cells[1]?.textContent?.trim() || '';
                                    const position = cells[0]?.textContent?.trim() || '';
                                    if (teamName) {
                                        previewTeams.push({ position, name: teamName });
                                    }
                                }
                            }
                        });
                    }
                    
                    results.push({
                        index: index,
                        title: title,
                        previewTeams: previewTeams,
                        linkText: link.textContent.trim()
                    });
                });
                
                return results;
            });
            
            await browser.close();
            browser = null;
            
            console.log(`✅ Discovery found ${tableInfo.length} tables`);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    discover: true,
                    tablesFound: tableInfo.length,
                    tables: tableInfo.map(t => ({
                        index: t.index,
                        title: t.title,
                        preview: t.previewTeams.length > 0 
                            ? `${t.previewTeams.map(p => `${p.position}. ${p.name}`).join(' • ')}`
                            : 'Preview not available',
                        sampleTeams: t.previewTeams
                    }))
                })
            };
        }
        
        // FETCH MODE: Click the specific "View Full Table" link
        const tableSelector = parseInt(params.tableSelector) || 0;
        
        const viewFullClicked = await page.evaluate((selectorIndex) => {
            const links = Array.from(document.querySelectorAll('a, button')).filter(el => 
                el.textContent.toLowerCase().includes('view full table') || 
                el.textContent.toLowerCase().includes('full table')
            );
            
            console.log('Found', links.length, 'View Full Table links');
            
            if (links.length > selectorIndex) {
                links[selectorIndex].click();
                return { clicked: true, totalLinks: links.length, clickedIndex: selectorIndex };
            } else if (links.length > 0) {
                links[0].click();
                return { clicked: true, totalLinks: links.length, clickedIndex: 0 };
            }
            return { clicked: false, totalLinks: links.length };
        }, tableSelector);

        if (viewFullClicked.clicked) {
            console.log(`✅ View Full Table clicked (${viewFullClicked.clickedIndex + 1} of ${viewFullClicked.totalLinks})`);
            await new Promise(r => setTimeout(r, 3000)); // Wait for table to render
        } else {
            console.log('⚠️ View Full Table not found, trying direct navigation...');
            // Fallback: try direct URL if we have division/competition
            if (division && competition) {
                const directUrl = `https://www.englandrugby.com/fixtures-and-results/search-results?competition=${competition}&division=${division}&season=${season}#tables`;
                await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        // Step 4: Wait for and scrape all tables
        console.log('📍 Step 4: Scraping tables...');
        
        await page.waitForSelector('table', { timeout: 10000 }).catch(() => {
            console.log('⚠️ No table selector found, continuing anyway...');
        });

        // Extract all tables from the page
        const allTables = await page.evaluate(() => {
            const tables = [];
            document.querySelectorAll('table').forEach((table, tableIdx) => {
                const standings = [];
                table.querySelectorAll('tbody tr').forEach((row, rowIdx) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 6) {
                        const teamCell = cells[1];
                        const teamLink = teamCell.querySelector('a');
                        const teamImg = teamCell.querySelector('img');
                        
                        let teamId = null;
                        if (teamLink && teamLink.href) {
                            const match = teamLink.href.match(/team=(\d+)/);
                            if (match) teamId = match[1];
                        }

                        standings.push({
                            position: parseInt(cells[0]?.textContent?.trim()) || rowIdx + 1,
                            team: {
                                name: teamLink?.textContent?.trim() || teamCell?.textContent?.trim() || '',
                                logo: teamImg?.src || null,
                                id: teamId
                            },
                            played: parseInt(cells[2]?.textContent?.trim()) || 0,
                            won: parseInt(cells[3]?.textContent?.trim()) || 0,
                            drawn: parseInt(cells[4]?.textContent?.trim()) || 0,
                            lost: parseInt(cells[5]?.textContent?.trim()) || 0,
                            pointsFor: parseInt(cells[6]?.textContent?.trim()) || 0,
                            pointsAgainst: parseInt(cells[7]?.textContent?.trim()) || 0,
                            pointsDiff: parseInt(cells[8]?.textContent?.trim()) || 0,
                            tryBonus: parseInt(cells[9]?.textContent?.trim()) || 0,
                            loseBonus: parseInt(cells[10]?.textContent?.trim()) || 0,
                            points: parseInt(cells[11]?.textContent?.trim()) || 0
                        });
                    }
                });

                if (standings.length > 0) {
                    const firstPos = standings[0]?.position || 0;
                    const lastPos = standings[standings.length - 1]?.position || 0;
                    tables.push({
                        index: tableIdx,
                        teamCount: standings.length,
                        positionRange: `${firstPos}-${lastPos}`,
                        firstPosition: firstPos,
                        preview: `${standings.length} teams (positions ${firstPos}-${lastPos}): ${standings.slice(0, 3).map(s => s.team.name).join(', ')}...`,
                        standings
                    });
                }
            });
            return tables;
        });

        await browser.close();
        browser = null;

        if (allTables.length === 0) {
            throw new Error('No league tables found on page after navigation');
        }

        console.log(`✅ Found ${allTables.length} tables`);

        // Discovery mode - return all tables
        if (discover) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    discover: true,
                    tablesFound: allTables.length,
                    tables: allTables.map(t => ({
                        index: t.index,
                        teamCount: t.teamCount,
                        positionRange: t.positionRange,
                        firstPosition: t.firstPosition,
                        preview: t.preview,
                        sampleTeams: t.standings.slice(0, 3).map(s => ({
                            position: s.position,
                            name: s.team.name,
                            played: s.played,
                            points: s.points
                        }))
                    }))
                })
            };
        }

        // Select the appropriate table
        let selectedTable;
        if (tableIndex > 0 && allTables.find(t => t.index === tableIndex)) {
            selectedTable = allTables.find(t => t.index === tableIndex);
        } else {
            // Auto-select: prefer table starting at position 1 with most teams
            selectedTable = allTables
                .filter(t => t.firstPosition === 1)
                .sort((a, b) => b.teamCount - a.teamCount)[0] || allTables[0];
        }

        console.log(`📊 Selected table with ${selectedTable.teamCount} teams`);

        const responseData = {
            team,
            division: division || 'auto',
            competition: competition || 'auto',
            season,
            cacheKey,
            tableIndex: selectedTable.index,
            standings: selectedTable.standings,
            scrapedAt: new Date().toISOString()
        };

        // Cache the result
        cacheMap.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                cached: false,
                data: responseData
            })
        };

    } catch (error) {
        console.error('❌ Puppeteer scraper error:', error);

        if (browser) {
            await browser.close().catch(() => {});
        }

        // Try to return stale cache
        const params = event.queryStringParameters || {};
        const cacheKey = params.team ? `team-${params.team}-${params.season || '2025-2026'}` : 'default';
        const cached = cacheMap.get(cacheKey);
        
        if (cached) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    cached: true,
                    stale: true,
                    warning: 'Using stale cache due to error',
                    error: error.message,
                    data: cached.data
                })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                hint: 'Puppeteer failed to scrape. Check function logs for details.'
            })
        };
    }
};