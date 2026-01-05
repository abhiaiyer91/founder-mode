import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool for creating landing page copy
 */
export const createLandingPageCopy = createTool({
  id: 'create-landing-page-copy',
  description: 'Create compelling landing page copy that converts visitors',
  inputSchema: z.object({
    productName: z.string().describe('Name of the product'),
    productDescription: z.string().describe('What the product does'),
    targetAudience: z.string().describe('Who the product is for'),
    uniqueValue: z.string().describe('What makes this product unique'),
    tone: z.enum(['professional', 'casual', 'exciting', 'technical']).default('exciting'),
  }),
  outputSchema: z.object({
    hero: z.object({
      headline: z.string(),
      subheadline: z.string(),
      cta: z.string(),
    }),
    features: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string(),
    })),
    socialProof: z.object({
      stats: z.array(z.object({ value: z.string(), label: z.string() })),
      testimonialPrompt: z.string(),
    }),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })),
    finalCta: z.object({
      headline: z.string(),
      cta: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    const { productName, productDescription, targetAudience, uniqueValue, tone } = context;
    
    const excitement = tone === 'exciting' ? '!' : '.';
    const informal = tone === 'casual' || tone === 'exciting';
    
    return {
      hero: {
        headline: `${uniqueValue.split(' ').slice(0, 5).join(' ')}${excitement}`,
        subheadline: `${productName} helps ${targetAudience} ${productDescription.toLowerCase()}. ${informal ? 'No complexity. Just results.' : 'Efficient. Reliable. Professional.'}`,
        cta: informal ? 'Get Started Free' : 'Start Your Trial',
      },
      features: [
        {
          title: 'Lightning Fast',
          description: `${productName} is built for speed. ${informal ? "Don't wait around—" : ''}get things done in seconds.`,
          icon: '⚡',
        },
        {
          title: 'Dead Simple',
          description: `No learning curve. ${informal ? "If you can click, you can use" : "Intuitive interface for"} ${productName}.`,
          icon: '✨',
        },
        {
          title: 'Built to Scale',
          description: `From solo ${targetAudience} to enterprise teams. ${productName} grows with you.`,
          icon: '📈',
        },
      ],
      socialProof: {
        stats: [
          { value: '10,000+', label: 'Active Users' },
          { value: '99.9%', label: 'Uptime' },
          { value: '4.9/5', label: 'User Rating' },
        ],
        testimonialPrompt: `"${productName} changed how we work. We shipped 3x faster in our first month."`,
      },
      faq: [
        {
          question: `What is ${productName}?`,
          answer: productDescription,
        },
        {
          question: 'How much does it cost?',
          answer: `${productName} offers a free tier to get started. Paid plans start at $19/month for teams.`,
        },
        {
          question: 'Can I try it before committing?',
          answer: `Absolutely! Start with our free plan—no credit card required. Upgrade when you're ready.`,
        },
      ],
      finalCta: {
        headline: `Ready to transform how ${informal ? 'you' : 'your team'} work${informal ? 's' : ''}?`,
        cta: `Start Using ${productName} Today`,
      },
    };
  },
});

/**
 * Tool for creating social media content
 */
export const createSocialPost = createTool({
  id: 'create-social-post',
  description: 'Create engaging social media posts for different platforms',
  inputSchema: z.object({
    platform: z.enum(['twitter', 'linkedin', 'instagram']).describe('Target platform'),
    topic: z.string().describe('What the post is about'),
    goal: z.enum(['awareness', 'engagement', 'conversion', 'announcement']).describe('Goal of the post'),
    productName: z.string().describe('Product name to mention'),
    includeEmoji: z.boolean().default(true),
  }),
  outputSchema: z.object({
    post: z.string(),
    hashtags: z.array(z.string()),
    bestTimeToPost: z.string(),
    tips: z.string(),
  }),
  execute: async ({ context }) => {
    const { platform, topic, goal, productName, includeEmoji } = context;
    
    let post = '';
    let hashtags: string[] = [];
    
    const emoji = includeEmoji ? {
      rocket: '🚀',
      fire: '🔥',
      star: '⭐',
      point: '👉',
      check: '✅',
      bulb: '💡',
    } : { rocket: '', fire: '', star: '', point: '', check: '', bulb: '' };
    
    if (platform === 'twitter') {
      if (goal === 'announcement') {
        post = `${emoji.rocket} Big news!\n\n${topic}\n\nTry ${productName} today ${emoji.point}`;
      } else if (goal === 'engagement') {
        post = `Hot take: ${topic}\n\nAgree or disagree? ${emoji.fire}\n\n(We built ${productName} because we agree)`;
      } else {
        post = `${emoji.bulb} ${topic}\n\nThis is exactly why we built ${productName}.\n\n${emoji.check} Simple\n${emoji.check} Fast\n${emoji.check} Powerful`;
      }
      hashtags = ['buildinpublic', 'startup', 'tech', 'saas'];
    } else if (platform === 'linkedin') {
      post = `I've been thinking about ${topic.toLowerCase()}.\n\nHere's what I learned:\n\n1. The old way doesn't work\n2. There's a better approach\n3. Tools like ${productName} make it possible\n\nWhat's your experience? I'd love to hear in the comments.`;
      hashtags = ['innovation', 'productivity', 'leadership', 'technology'];
    } else {
      post = `${emoji.star} ${topic} ${emoji.star}\n\n${productName} makes it happen.\n\nLink in bio ${emoji.point}`;
      hashtags = ['startup', 'tech', 'innovation', 'entrepreneur'];
    }

    const bestTimes: Record<string, string> = {
      twitter: '9 AM - 12 PM or 7 PM - 9 PM',
      linkedin: 'Tuesday-Thursday, 8 AM - 10 AM',
      instagram: 'Monday-Friday, 11 AM - 1 PM',
    };

    return {
      post,
      hashtags,
      bestTimeToPost: bestTimes[platform],
      tips: platform === 'twitter' 
        ? 'Keep it punchy. Ask questions. Engage with replies quickly.'
        : platform === 'linkedin'
        ? 'Be professional but personal. Share insights, not just promotions.'
        : 'Use high-quality visuals. Stories perform well for engagement.',
    };
  },
});

/**
 * Tool for creating email campaigns
 */
export const createEmailCampaign = createTool({
  id: 'create-email-campaign',
  description: 'Create an email campaign with subject lines and body copy',
  inputSchema: z.object({
    campaignType: z.enum(['welcome', 'feature', 'retention', 'winback']).describe('Type of email'),
    productName: z.string().describe('Product name'),
    recipientSegment: z.string().describe('Who is receiving this email'),
    keyMessage: z.string().describe('The main thing to communicate'),
  }),
  outputSchema: z.object({
    subjectLine: z.string(),
    previewText: z.string(),
    body: z.string(),
    cta: z.string(),
    sendTime: z.string(),
  }),
  execute: async ({ context }) => {
    const { campaignType, productName, recipientSegment, keyMessage } = context;
    
    let result = {
      subjectLine: '',
      previewText: '',
      body: '',
      cta: '',
      sendTime: '',
    };
    
    if (campaignType === 'welcome') {
      result = {
        subjectLine: `Welcome to ${productName}! 🎉`,
        previewText: `Here's how to get started in 30 seconds...`,
        body: `Hi there!\n\nWelcome to ${productName}. We're thrilled to have you.\n\n${keyMessage}\n\nHere's what you can do right now:\n\n1. Complete your profile\n2. Create your first project\n3. Invite your team\n\nNeed help? Reply to this email—we read every message.\n\nCheers,\nThe ${productName} Team`,
        cta: 'Get Started Now',
        sendTime: 'Immediately after signup',
      };
    } else if (campaignType === 'feature') {
      result = {
        subjectLine: `New in ${productName}: ${keyMessage.split(' ').slice(0, 4).join(' ')}`,
        previewText: `You asked, we built it...`,
        body: `Hey!\n\nWe've got exciting news.\n\n${keyMessage}\n\nThis feature is now live for all ${recipientSegment}.\n\nHere's what it means for you:\n\n• Work faster\n• Get better results\n• Spend less time on busywork\n\nWe built this based on your feedback—thank you for helping us improve.\n\nTry it out and let us know what you think!\n\nBest,\nThe ${productName} Team`,
        cta: 'Try the New Feature',
        sendTime: 'Tuesday or Thursday, 10 AM local time',
      };
    } else if (campaignType === 'retention') {
      result = {
        subjectLine: `Quick tip to get more from ${productName}`,
        previewText: `Most users miss this...`,
        body: `Hi there!\n\nWe noticed you've been using ${productName}—that's awesome!\n\n${keyMessage}\n\nHere's a pro tip that 90% of users miss:\n\nTry [specific feature] to save hours every week.\n\nNeed a hand setting it up? We're here to help.\n\nCheers,\nThe ${productName} Team`,
        cta: 'Show Me How',
        sendTime: '7 days after last activity',
      };
    } else {
      result = {
        subjectLine: `We miss you! Here's what's new in ${productName}`,
        previewText: `Things have changed since you've been away...`,
        body: `Hey!\n\nIt's been a while since we've seen you in ${productName}.\n\n${keyMessage}\n\nSince you've been away, we've added:\n\n• Faster performance\n• New integrations\n• Simpler workflows\n\nWe'd love to have you back. Here's 20% off your next month, just for returning.\n\nUse code: WELCOMEBACK20\n\nSee you soon?\n\nThe ${productName} Team`,
        cta: 'Come Back & Save 20%',
        sendTime: '30 days after last activity',
      };
    }
    
    return result;
  },
});

export const marketingTools = {
  createLandingPageCopy,
  createSocialPost,
  createEmailCampaign,
};
