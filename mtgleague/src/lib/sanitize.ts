// HTML sanitization utility for store announcements
// Allows safe HTML tags and attributes while preventing malicious code

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote', 'code', 'pre'
];

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'target', 'rel'],
  'span': ['class'],
  'div': ['class'],
  'p': ['class'],
  'h1': ['class'], 'h2': ['class'], 'h3': ['class'], 'h4': ['class'], 'h5': ['class'], 'h6': ['class']
};

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Recursively sanitize nodes
  sanitizeNode(tempDiv);
  
  return tempDiv.innerHTML;
}

function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    
    // Remove disallowed tags
    if (!ALLOWED_TAGS.includes(tagName)) {
      // Replace with text content
      const textNode = document.createTextNode(element.textContent || '');
      element.parentNode?.replaceChild(textNode, element);
      return;
    }
    
    // Sanitize attributes
    const allowedAttrs = ALLOWED_ATTRIBUTES[tagName as keyof typeof ALLOWED_ATTRIBUTES] || [];
    const attributes = Array.from(element.attributes);
    
    attributes.forEach(attr => {
      if (!allowedAttrs.includes(attr.name)) {
        element.removeAttribute(attr.name);
        return;
      }
      
      // Special handling for href attributes (links)
      if (attr.name === 'href') {
        const url = attr.value;
        if (!isValidUrl(url)) {
          element.removeAttribute(attr.name);
          return;
        }
      }
      
      // Special handling for target attribute (ensure security)
      if (attr.name === 'target' && attr.value === '_blank') {
        // Add rel="noopener noreferrer" for security
        element.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    // Recursively sanitize child nodes
    const children = Array.from(element.childNodes);
    children.forEach(child => sanitizeNode(child));
  } else if (node.nodeType === Node.TEXT_NODE) {
    // Text nodes are safe, no action needed
    return;
  } else {
    // Remove other node types (comments, etc.)
    node.parentNode?.removeChild(node);
  }
}

function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_PROTOCOLS.includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Alternative: Simple text-based sanitization for server-side use
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove all HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Escape HTML entities
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Convert plain text to safe HTML
export function textToHtml(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
} 