/**
 * HTML Sanitization Utilities
 * Lightweight sanitizer for CMS content displayed via innerHTML.
 * Prevents XSS by stripping dangerous tags/attributes while allowing safe formatting.
 */
(function() {
    'use strict';

    // Tags allowed in rich CMS content (articles, descriptions)
    const ALLOWED_TAGS = new Set([
        'p', 'br', 'b', 'i', 'em', 'strong', 'u', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
        'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'sub', 'sup', 'small'
    ]);

    // Attributes allowed per tag
    const ALLOWED_ATTRS = {
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'width', 'height', 'style'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan'],
        'span': ['class', 'style'],
        'div': ['class', 'style'],
        'p': ['class', 'style'],
        '*': ['class']
    };

    // Patterns that indicate malicious attribute values
    const DANGEROUS_PATTERNS = /javascript:|data:|vbscript:|on\w+\s*=/i;

    /**
     * Escape HTML entities in plain text to prevent injection.
     * Use this for text-only fields (names, titles, addresses).
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Sanitize HTML content, allowing safe tags and stripping dangerous ones.
     * Use this for rich content fields (article body, descriptions with formatting).
     */
    function sanitizeHTML(html) {
        if (!html) return '';

        // Use the browser's parser to safely parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        function cleanNode(node) {
            const result = [];

            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    result.push(escapeHtml(child.textContent));
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tagName = child.tagName.toLowerCase();

                    if (!ALLOWED_TAGS.has(tagName)) {
                        // Strip the tag but keep its text content (escaped)
                        result.push(escapeHtml(child.textContent));
                        continue;
                    }

                    // Build sanitized opening tag
                    let tag = `<${tagName}`;

                    // Filter attributes
                    const allowedForTag = ALLOWED_ATTRS[tagName] || [];
                    const allowedGlobal = ALLOWED_ATTRS['*'] || [];
                    const allAllowed = new Set([...allowedForTag, ...allowedGlobal]);

                    for (const attr of child.attributes) {
                        const attrName = attr.name.toLowerCase();

                        // Skip event handlers and unlisted attributes
                        if (attrName.startsWith('on')) continue;
                        if (!allAllowed.has(attrName)) continue;

                        // Check attribute value for dangerous patterns
                        const attrValue = attr.value;
                        if (DANGEROUS_PATTERNS.test(attrValue)) continue;

                        // For href, only allow http(s) and relative URLs
                        if (attrName === 'href') {
                            const trimmed = attrValue.trim().toLowerCase();
                            if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
                                continue;
                            }
                        }

                        // For src on images, only allow http(s) and relative URLs
                        if (attrName === 'src') {
                            const trimmed = attrValue.trim().toLowerCase();
                            if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('./') && !trimmed.startsWith('../')) {
                                continue;
                            }
                        }

                        tag += ` ${escapeHtml(attrName)}="${escapeHtml(attrValue)}"`;
                    }

                    // Self-closing tags
                    if (['br', 'hr', 'img'].includes(tagName)) {
                        tag += '>';
                        result.push(tag);
                    } else {
                        tag += '>';
                        result.push(tag);
                        result.push(cleanNode(child));
                        result.push(`</${tagName}>`);
                    }
                }
            }

            return result.join('');
        }

        return cleanNode(doc.body);
    }

    /**
     * Sanitize text and convert newlines to <br> safely.
     * Use this for plain text fields that need line break preservation.
     */
    function escapeHtmlWithBreaks(str) {
        if (!str) return '';
        return escapeHtml(str).replace(/\n/g, '<br>');
    }

    // Expose globally
    window.sanitizeHTML = sanitizeHTML;
    window.escapeHtml = escapeHtml;
    window.escapeHtmlWithBreaks = escapeHtmlWithBreaks;
})();
