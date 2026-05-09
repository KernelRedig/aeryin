export const config = {
  matcher: '/(.*)',
};

export default function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  const url = request.url || '';
  
  const allowedBots = [
    'discord',
    'twitter',
    'facebook',
    'linkedin',
    'telegram'
  ];
  
  const isAllowedBot = allowedBots.some(bot => userAgent.toLowerCase().includes(bot));
  if (isAllowedBot) {
    return;
  }

  const blockedAgents = [
    'curl', 
    'wget', 
    'python-requests', 
    'scraper', 
    'bot', 
    'spider', 
    'view-page-source',
    'httpclient',
    'java',
    'postman'
  ];

  const isBot = blockedAgents.some(bot => userAgent.toLowerCase().includes(bot));

  if (isBot || userAgent.trim() === '') {
    return new Response(
      'Access Denied: Golden Shield has blocked this request. Bots and scrapers are not allowed.', 
      { 
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}