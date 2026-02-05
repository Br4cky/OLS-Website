// netlify/functions/get-submissions.js
// 🎯 OLS 29 FIX: REMOVED 20-SPONSOR LIMIT - Now fetches ALL sponsors with pagination

exports.handler = async (event, context) => {
  // 🎯 VERSION: OLS-29 - Removed artificial 20-sponsor limit
  console.log('🚀 Function version: OLS-29 - Full pagination enabled');
  
  const { formName } = JSON.parse(event.body || '{}');
  
  if (!formName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'formName is required' })
    };
  }

  try {
    const siteId = process.env.SITE_ID || 'gleeful-panda-146290';
    
    // 🎯 FIX: Try multiple token sources in order of preference
    const accessToken = context.clientContext?.custom?.netlify_token || 
                        process.env.NETLIFY_ACCESS_TOKEN;
    
    // 🎯 FIX: Set longer timeout for large forms
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    // 🎯 FIX: Better error handling for missing token
    if (!accessToken) {
      console.error('❌ No access token available');
      console.error('Available context:', JSON.stringify(context, null, 2));
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Authentication not configured',
          hint: 'Set NETLIFY_ACCESS_TOKEN in environment variables'
        })
      };
    }
    
    console.log(`📡 Fetching ALL pages for form: olrfc-${formName}`);
    
    // 🎯 NEW: PAGINATION LOOP - Fetch ALL submissions, not just first page
    let allSubmissions = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100; // Max allowed by Netlify API
    
    while (hasMore && page <= 10) { // Safety limit: max 10 pages = 1000 items
      const apiUrl = `https://api.netlify.com/api/v1/sites/${siteId}/submissions?form_name=olrfc-${formName}&per_page=${perPage}&page=${page}`;
      
      console.log(`📄 Fetching page ${page} for olrfc-${formName}...`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Netlify API error:', response.status);
        console.error('Error details:', errorText);
        
        // If error on page 1, return error. If error on later pages, just stop pagination
        if (page === 1) {
          clearTimeout(timeoutId);
          return {
            statusCode: response.status,
            body: JSON.stringify({ 
              error: `Netlify API error: ${response.status}`,
              details: errorText,
              form: `olrfc-${formName}`
            })
          };
        } else {
          console.warn(`⚠️ Error on page ${page}, stopping pagination`);
          hasMore = false;
          break;
        }
      }
      
      const pageSubmissions = await response.json();
      console.log(`✅ Page ${page}: Retrieved ${pageSubmissions.length} submissions`);
      
      if (pageSubmissions.length === 0) {
        hasMore = false;
      } else {
        allSubmissions = allSubmissions.concat(pageSubmissions);
        
        // If we got fewer than perPage items, this is the last page
        if (pageSubmissions.length < perPage) {
          hasMore = false;
        }
        
        page++;
      }
    }
    
    clearTimeout(timeoutId);
    
    const submissions = allSubmissions;
    console.log(`📊 TOTAL Retrieved ${submissions.length} submissions for olrfc-${formName} across ${page - 1} pages`);
    
    // Parse and VALIDATE the submission data
    const parsedData = submissions
      .map(sub => {
        const data = {};
        
        // 🎯 FIX: For sponsors, strip down to ONLY essential fields to reduce payload
        if (formName === 'sponsors') {
          // Only return fields absolutely needed
          data.id = sub.data.id;
          data.name = sub.data.name;
          data.logo = sub.data.logo;
          data.website = sub.data.website;
          data.active = sub.data.active;
          data.showInBanner = sub.data.showInBanner;
          data.tier = sub.data.tier;
          // Skip: description, email, phone, address, dateAdded, etc.
        } else {
          // For other forms, return all data
          Object.keys(sub.data).forEach(key => {
            data[key] = sub.data[key];
          });
        }
        
        return data;
      })
      .filter(item => {
        // ✅ VALIDATION: Filter out entries with undefined/null critical fields
        switch(formName) {
          case 'news':
            return item.title && 
                   item.title !== 'undefined' && 
                   item.content && 
                   item.content !== 'undefined' &&
                   item.author &&
                   item.author !== 'undefined';
          
          case 'fixtures':
            return item.opponent && 
                   item.opponent !== 'undefined' && 
                   item.dateTime &&
                   item.team;
          
          case 'players':
            return item.name && 
                   item.name !== 'undefined' && 
                   item.team;
          
          case 'sponsors':
            // Sponsors must have name AND tier (players don't have tier)
            // Also reject if it has player-specific fields (position, team)
            return item.name && 
                   item.name !== 'undefined' &&
                   item.tier && // Sponsors must have a tier
                   !item.position && // Players have position, sponsors don't
                   (!item.team || item.team === undefined); // Players have team, sponsors don't
          
          case 'gallery':
            return item.title && 
                   item.title !== 'undefined' &&
                   item.photos;
          
          case 'shop':
            return item.name && 
                   item.name !== 'undefined' && 
                   item.price;

          case 'contacts':
            return item.name && 
                   item.name !== 'undefined' && 
                   item.role &&
                   item.role !== 'undefined';

          case 'teams':
            // Teams must have name, slug, and ageGroup
            // Reject if it has player-specific fields (position, team field)
            // Reject if it has sponsor-specific fields (tier, website)
            return item.name && 
                   item.name !== 'undefined' &&
                   item.slug && 
                   item.slug !== 'undefined' &&
                   item.ageGroup && // Teams must have ageGroup
                   !item.position && // Players have position, teams don't
                   !item.team && // Players have team, teams don't
                   !item.tier && // Sponsors have tier, teams don't
                   !item.opponent; // Fixtures have opponent, teams don't

          case 'team-filters':
            // Team filters must have name, id, and teamSlugs array
            return item.name && 
                   item.name !== 'undefined' &&
                   item.id && 
                   item.id !== 'undefined' &&
                   item.teamSlugs; // Must have teamSlugs (JSON string)

          case 'site-settings':
            return item['setting-name'] && 
                   item['setting-name'] !== 'undefined' &&
                   item['setting-value'] !== 'undefined';
          
          default:
            // For unknown types, ensure at least some basic data exists
            return Object.keys(item).length > 0 && 
                   Object.values(item).some(v => v && v !== 'undefined');
        }
      });

    console.log(`✅ Validated ${formName}: ${parsedData.length} valid entries (from ${submissions.length} total)`);

    // 🔧 DEDUPLICATE by ID to prevent returning duplicate entries from Netlify Forms
    let finalData = parsedData;
    if (parsedData.length > 0 && parsedData[0] && parsedData[0].id) {
      const seen = new Map();
      const deduplicatedData = [];
      
      for (const item of parsedData) {
        if (item && item.id && !seen.has(item.id)) {
          seen.set(item.id, true);
          deduplicatedData.push(item);
        }
      }
      
      if (deduplicatedData.length < parsedData.length) {
        console.log(`🧹 Removed ${parsedData.length - deduplicatedData.length} duplicate ${formName} entries from Netlify Forms`);
      }
      
      finalData = deduplicatedData;
    }

    // 🎯 REMOVED: The .slice(0, 20) limit that was causing the issue!
    // Now returns ALL sponsors, not just 20
    console.log(`✅ Returning ${finalData.length} ${formName} items (NO LIMIT)`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        data: finalData,
        meta: {
          totalPages: page - 1,
          total: submissions.length,
          valid: parsedData.length,
          filtered: submissions.length - parsedData.length,
          returned: finalData.length
        }
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    
    // 🎯 Special handling for timeout errors
    if (error.name === 'AbortError') {
      return {
        statusCode: 504,
        body: JSON.stringify({ 
          error: 'Request timeout',
          message: 'Form has too many submissions. Try limiting results or contact support.',
          form: `olrfc-${formName}`
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};