
import "dotenv/config";
import bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';

import { db } from '../db';
import { users, profiles, installedApps, follows } from '../../shared/schema';

type DummyApp = {
  packageName: string;
  appName: string;
  appIcon?: string;
  platform?: 'android' | 'ios';
  isVisible?: boolean;
};

type DummyUser = {
  email: string;
  username: string;
  password: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  showApps?: boolean;
  isPrivate?: boolean;
  apps: DummyApp[];
  following?: string[];
};

const sharedPassword = 'DummyPass123!';

const dummyUsers: DummyUser[] = [

{
  email: 'elon.musk@appstalker.dev',
  username: 'elonmusk',
  password: sharedPassword,
  displayName: 'Elon Musk',
  bio: 'Engineering, rockets, EVs, memes.',
  avatarUrl: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.tesla', appName: 'Tesla', appIcon: 'https://logo.clearbit.com/tesla.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.slack', appName: 'Slack', appIcon: 'https://logo.clearbit.com/slack.com' },
    { packageName: 'com.github.android', appName: 'GitHub', appIcon: 'https://logo.clearbit.com/github.com' },
    { packageName: 'com.spacex.starlink', appName: 'Starlink', appIcon: 'https://logo.clearbit.com/starlink.com' },
    { packageName: 'com.microsoft.teams', appName: 'Teams', appIcon: 'https://logo.clearbit.com/microsoft.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.binance.dev', appName: 'Binance', appIcon: 'https://logo.clearbit.com/binance.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.epicgames.fortnite', appName: 'Fortnite', appIcon: 'https://logo.clearbit.com/epicgames.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', appIcon: 'https://logo.clearbit.com/google.com' },
  ],
  following: ['demouser', 'billgates', 'jeffbezos', 'donalddjtrump'],
},

{
  email: 'donald.trump@appstalker.dev',
  username: 'donalddjtrump',
  password: sharedPassword,
  displayName: 'Donald Trump',
  bio: '45th President of the United States.',
  avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.truthsocial.app', appName: 'Truth Social', appIcon: 'https://logo.clearbit.com/truthsocial.com' },
    { packageName: 'com.foxnews.android', appName: 'Fox News', appIcon: 'https://logo.clearbit.com/foxnews.com' },
    { packageName: 'com.cnn.mobile.android.phone', appName: 'CNN', appIcon: 'https://logo.clearbit.com/cnn.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.facebook.katana', appName: 'Facebook', appIcon: 'https://logo.clearbit.com/facebook.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'bbc.mobile.news.ww', appName: 'BBC News', appIcon: 'https://logo.clearbit.com/bbc.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['elonmusk', 'billgates', 'kimkardashian'],
},

{
  email: 'kim.kardashian@appstalker.dev',
  username: 'kimkardashian',
  password: sharedPassword,
  displayName: 'Kim Kardashian',
  bio: 'SKIMS, beauty, media.',
  avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
    { packageName: 'com.canva.editor', appName: 'Canva', appIcon: 'https://logo.clearbit.com/canva.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.shopify.mobile', appName: 'Shopify', appIcon: 'https://logo.clearbit.com/shopify.com' },
    { packageName: 'com.amazon.mShop.android.shopping', appName: 'Amazon', appIcon: 'https://logo.clearbit.com/amazon.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
  ],
  following: ['rihanna', 'beyonce', 'drake', 'demouser'],
},

{
  email: 'jay.z@appstalker.dev',
  username: 'jayz',
  password: sharedPassword,
  displayName: 'Jay-Z',
  bio: 'Music, business, culture.',
  avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.tidal', appName: 'TIDAL', appIcon: 'https://logo.clearbit.com/tidal.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.soundcloud.android', appName: 'SoundCloud', appIcon: 'https://logo.clearbit.com/soundcloud.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.slack', appName: 'Slack', appIcon: 'https://logo.clearbit.com/slack.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
  ],
  following: ['beyonce', 'drake', 'rihanna', 'elonmusk'],
},

{
  email: 'rihanna@appstalker.dev',
  username: 'rihanna',
  password: sharedPassword,
  displayName: 'Rihanna',
  bio: 'Fenty & music.',
  avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
    { packageName: 'com.canva.editor', appName: 'Canva', appIcon: 'https://logo.clearbit.com/canva.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
  ],
  following: ['jayz', 'beyonce', 'kimkardashian', 'demouser'],
},

{
  email: 'taylor.swift@appstalker.dev',
  username: 'taylorswift',
  password: sharedPassword,
  displayName: 'Taylor Swift',
  bio: 'Songwriter, touring.',
  avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.canva.editor', appName: 'Canva', appIcon: 'https://logo.clearbit.com/canva.com' },
    { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
  ],
  following: ['selena', 'arianagrande', 'drake', 'demouser'],
},

{
  email: 'beyonce@appstalker.dev',
  username: 'beyonce',
  password: sharedPassword,
  displayName: 'Beyoncé',
  bio: 'Music + business.',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.tidal', appName: 'TIDAL', appIcon: 'https://logo.clearbit.com/tidal.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
    { packageName: 'com.canva.editor', appName: 'Canva', appIcon: 'https://logo.clearbit.com/canva.com' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
  ],
  following: ['jayz', 'rihanna', 'drake', 'demouser'],
},

{
  email: 'drake@appstalker.dev',
  username: 'drake',
  password: sharedPassword,
  displayName: 'Drake',
  bio: 'Music, Raptors, 6.',
  avatarUrl: 'https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.soundcloud.android', appName: 'SoundCloud', appIcon: 'https://logo.clearbit.com/soundcloud.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
  ],
  following: ['beyonce', 'jayz', 'rihanna', 'demouser'],
},

{
  email: 'bill.gates@appstalker.dev',
  username: 'billgates',
  password: sharedPassword,
  displayName: 'Bill Gates',
  bio: 'Software, philanthropy, climate.',
  avatarUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.microsoft.office.officehubrow', appName: 'Microsoft 365', appIcon: 'https://logo.clearbit.com/microsoft.com' },
    { packageName: 'com.microsoft.teams', appName: 'Teams', appIcon: 'https://logo.clearbit.com/microsoft.com' },
    { packageName: 'com.github.android', appName: 'GitHub', appIcon: 'https://logo.clearbit.com/github.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.nytimes.android', appName: 'NYTimes', appIcon: 'https://logo.clearbit.com/nytimes.com' },
    { packageName: 'com.reuters', appName: 'Reuters', appIcon: 'https://logo.clearbit.com/reuters.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.google.android.apps.docs', appName: 'Google Docs', appIcon: 'https://logo.clearbit.com/google.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
  ],
  following: ['elonmusk', 'jeffbezos', 'demouser', 'oprah'],
},

{
  email: 'jeff.bezos@appstalker.dev',
  username: 'jeffbezos',
  password: sharedPassword,
  displayName: 'Jeff Bezos',
  bio: 'Amazon & Blue Origin.',
  avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.amazon.mShop.android.shopping', appName: 'Amazon', appIcon: 'https://logo.clearbit.com/amazon.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.nytimes.android', appName: 'NYTimes', appIcon: 'https://logo.clearbit.com/nytimes.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.blueorigin.app', appName: 'Blue Origin', appIcon: 'https://logo.clearbit.com/blueorigin.com' },
    { packageName: 'com.amazon.kindle', appName: 'Kindle', appIcon: 'https://logo.clearbit.com/amazon.com' },
    { packageName: 'com.audible.application', appName: 'Audible', appIcon: 'https://logo.clearbit.com/audible.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.github.android', appName: 'GitHub', appIcon: 'https://logo.clearbit.com/github.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['billgates', 'elonmusk', 'markz', 'demouser'],
},

{
  email: 'mark.zuckerberg@appstalker.dev',
  username: 'markz',
  password: sharedPassword,
  displayName: 'Mark Zuckerberg',
  bio: 'Meta, VR, jiu-jitsu.',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.facebook.katana', appName: 'Facebook', appIcon: 'https://logo.clearbit.com/facebook.com' },
    { packageName: 'com.oculus.twilight', appName: 'Meta Quest', appIcon: 'https://logo.clearbit.com/meta.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.slack', appName: 'Slack', appIcon: 'https://logo.clearbit.com/slack.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
  ],
  following: ['sundarp', 'timcook', 'satyan', 'demouser'],
},

{
  email: 'sundar.pichai@appstalker.dev',
  username: 'sundarp',
  password: sharedPassword,
  displayName: 'Sundar Pichai',
  bio: 'Google & Alphabet.',
  avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', appIcon: 'https://logo.clearbit.com/google.com' },
    { packageName: 'com.google.android.apps.docs', appName: 'Google Docs', appIcon: 'https://logo.clearbit.com/google.com' },
    { packageName: 'com.google.android.gm', appName: 'Gmail', appIcon: 'https://logo.clearbit.com/google.com' },
    { packageName: 'com.google.android.youtube', appName: 'YouTube', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.slack', appName: 'Slack', appIcon: 'https://logo.clearbit.com/slack.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.gitlab.mobile', appName: 'GitLab', appIcon: 'https://logo.clearbit.com/gitlab.com' },
    { packageName: 'com.github.android', appName: 'GitHub', appIcon: 'https://logo.clearbit.com/github.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
  ],
  following: ['markz', 'timcook', 'satyan', 'demouser'],
},

{
  email: 'tim.cook@appstalker.dev',
  username: 'timcook',
  password: sharedPassword,
  displayName: 'Tim Cook',
  bio: 'Apple CEO.',
  avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.apple.android.weather', appName: 'Apple Weather', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.nytimes.android', appName: 'NYTimes', appIcon: 'https://logo.clearbit.com/nytimes.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.microsoft.teams', appName: 'Teams', appIcon: 'https://logo.clearbit.com/microsoft.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.amazon.kindle', appName: 'Kindle', appIcon: 'https://logo.clearbit.com/amazon.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', appIcon: 'https://logo.clearbit.com/google.com' },
    { packageName: 'com.apple.news', appName: 'Apple News', appIcon: 'https://logo.clearbit.com/apple.com' },
  ],
  following: ['sundarp', 'markz', 'satyan', 'demouser'],
},

{
  email: 'satya.nadella@appstalker.dev',
  username: 'satyan',
  password: sharedPassword,
  displayName: 'Satya Nadella',
  bio: 'Microsoft CEO.',
  avatarUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.microsoft.office.officehubrow', appName: 'Microsoft 365', appIcon: 'https://logo.clearbit.com/microsoft.com' },
    { packageName: 'com.microsoft.teams', appName: 'Teams', appIcon: 'https://logo.clearbit.com/microsoft.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.github.android', appName: 'GitHub', appIcon: 'https://logo.clearbit.com/github.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.slack', appName: 'Slack', appIcon: 'https://logo.clearbit.com/slack.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
    { packageName: 'com.google.android.apps.docs', appName: 'Google Docs', appIcon: 'https://logo.clearbit.com/google.com' },
  ],
  following: ['timcook', 'sundarp', 'markz', 'demouser'],
},

{
  email: 'oprah.win@appstalker.dev',
  username: 'oprah',
  password: sharedPassword,
  displayName: 'Oprah Winfrey',
  bio: 'Media and philanthropy.',
  avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.amazon.kindle', appName: 'Kindle', appIcon: 'https://logo.clearbit.com/amazon.com' },
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
    { packageName: 'bbc.mobile.news.ww', appName: 'BBC News', appIcon: 'https://logo.clearbit.com/bbc.com' },
  ],
  following: ['billgates', 'rihanna', 'taylorswift', 'demouser'],
},

{
  email: 'lebron.james@appstalker.dev',
  username: 'lebronjames',
  password: sharedPassword,
  displayName: 'LeBron James',
  bio: 'Hoops & media.',
  avatarUrl: 'https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.nbaimd.gametime.nba2011', appName: 'NBA App', appIcon: 'https://logo.clearbit.com/nba.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.strava', appName: 'Strava', appIcon: 'https://logo.clearbit.com/strava.com' },
    { packageName: 'com.peloton.app', appName: 'Peloton', appIcon: 'https://logo.clearbit.com/onepeloton.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.tidal', appName: 'TIDAL', appIcon: 'https://logo.clearbit.com/tidal.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
  ],
  following: ['cristiano', 'messi', 'drake', 'demouser'],
},

{
  email: 'cristiano.ronaldo@appstalker.dev',
  username: 'cristiano',
  password: sharedPassword,
  displayName: 'Cristiano Ronaldo',
  bio: 'Football & fitness.',
  avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.strava', appName: 'Strava', appIcon: 'https://logo.clearbit.com/strava.com' },
    { packageName: 'com.peloton.app', appName: 'Peloton', appIcon: 'https://logo.clearbit.com/onepeloton.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['messi', 'neymar', 'lebronjames', 'demouser'],
},

{
  email: 'lionel.messi@appstalker.dev',
  username: 'messi',
  password: sharedPassword,
  displayName: 'Lionel Messi',
  bio: 'Football.',
  avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.strava', appName: 'Strava', appIcon: 'https://logo.clearbit.com/strava.com' },
    { packageName: 'com.peloton.app', appName: 'Peloton', appIcon: 'https://logo.clearbit.com/onepeloton.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', appIcon: 'https://logo.clearbit.com/google.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['cristiano', 'neymar', 'lebronjames', 'demouser'],
},

{
  email: 'neymar.jr@appstalker.dev',
  username: 'neymar',
  password: sharedPassword,
  displayName: 'Neymar Jr.',
  bio: 'Football + gaming.',
  avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.strava', appName: 'Strava', appIcon: 'https://logo.clearbit.com/strava.com' },
    { packageName: 'com.peloton.app', appName: 'Peloton', appIcon: 'https://logo.clearbit.com/onepeloton.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.epicgames.fortnite', appName: 'Fortnite', appIcon: 'https://logo.clearbit.com/epicgames.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['messi', 'cristiano', 'lebronjames', 'demouser'],
},

{
  email: 'selena.gomez@appstalker.dev',
  username: 'selena',
  password: sharedPassword,
  displayName: 'Selena Gomez',
  bio: 'Music & acting.',
  avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.canva.editor', appName: 'Canva', appIcon: 'https://logo.clearbit.com/canva.com' },
    { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['taylorswift', 'arianagrande', 'justinbieber', 'demouser'],
},

{
  email: 'justin.bieber@appstalker.dev',
  username: 'justinbieber',
  password: sharedPassword,
  displayName: 'Justin Bieber',
  bio: 'Music.',
  avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
  ],
  following: ['taylorswift', 'selena', 'arianagrande', 'demouser'],
},

{
  email: 'ariana.grande@appstalker.dev',
  username: 'arianagrande',
  password: sharedPassword,
  displayName: 'Ariana Grande',
  bio: 'Music.',
  avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.apple.android.music', appName: 'Apple Music', appIcon: 'https://logo.clearbit.com/apple.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', appIcon: 'https://logo.clearbit.com/whatsapp.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
  ],
  following: ['taylorswift', 'selena', 'justinbieber', 'demouser'],
},

{
  email: 'mr.beast@appstalker.dev',
  username: 'mrbeast',
  password: sharedPassword,
  displayName: 'MrBeast',
  bio: 'YouTube + philanthropy.',
  avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.google.android.youtube', appName: 'YouTube', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', appIcon: 'https://logo.clearbit.com/snapchat.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['pewdiepie', 'elonmusk', 'drake', 'demouser'],
},

{
  email: 'pewdie.pie@appstalker.dev',
  username: 'pewdiepie',
  password: sharedPassword,
  displayName: 'PewDiePie',
  bio: 'YouTube creator.',
  avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.google.android.youtube', appName: 'YouTube', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.discord', appName: 'Discord', appIcon: 'https://logo.clearbit.com/discord.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.tiktok.android', appName: 'TikTok', appIcon: 'https://logo.clearbit.com/tiktok.com' },
    { packageName: 'tv.twitch.android.app', appName: 'Twitch', appIcon: 'https://logo.clearbit.com/twitch.tv' },
    { packageName: 'com.epicgames.fortnite', appName: 'Fortnite', appIcon: 'https://logo.clearbit.com/epicgames.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', appIcon: 'https://logo.clearbit.com/youtube.com' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['mrbeast', 'elonmusk', 'taylorswift', 'demouser'],
},

{
  email: 'emma.watson@appstalker.dev',
  username: 'emmawatson',
  password: sharedPassword,
  displayName: 'Emma Watson',
  bio: 'Acting & advocacy.',
  avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60',
  apps: [
    { packageName: 'com.instagram.android', appName: 'Instagram', appIcon: 'https://logo.clearbit.com/instagram.com' },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', appIcon: 'https://logo.clearbit.com/twitter.com' },
    { packageName: 'com.linkedin.android', appName: 'LinkedIn', appIcon: 'https://logo.clearbit.com/linkedin.com' },
    { packageName: 'com.goodreads', appName: 'Goodreads', appIcon: 'https://logo.clearbit.com/goodreads.com' },
    { packageName: 'com.headspace.android', appName: 'Headspace', appIcon: 'https://logo.clearbit.com/headspace.com' },
    { packageName: 'com.duolingo', appName: 'Duolingo', appIcon: 'https://logo.clearbit.com/duolingo.com' },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', appIcon: 'https://logo.clearbit.com/netflix.com' },
    { packageName: 'com.spotify.music', appName: 'Spotify', appIcon: 'https://logo.clearbit.com/spotify.com' },
    { packageName: 'com.amazon.kindle', appName: 'Kindle', appIcon: 'https://logo.clearbit.com/amazon.com' },
    { packageName: 'com.pinterest', appName: 'Pinterest', appIcon: 'https://logo.clearbit.com/pinterest.com' },
    { packageName: 'com.canva.editor', appName: 'Canva', appIcon: 'https://logo.clearbit.com/canva.com' },
    { packageName: 'com.robinhood.android', appName: 'Robinhood', appIcon: 'https://logo.clearbit.com/robinhood.com' },
    { packageName: 'com.coinbase.android', appName: 'Coinbase', appIcon: 'https://logo.clearbit.com/coinbase.com' },
    { packageName: 'com.notion.android', appName: 'Notion', appIcon: 'https://logo.clearbit.com/notion.so' },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', appIcon: 'https://logo.clearbit.com/reddit.com' },
  ],
  following: ['oprah', 'taylorswift', 'selena', 'demouser'],
},

];

async function ensureFollow(followerId: string, followingId: string) {
  if (followerId === followingId) return;
  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(follows).values({
      followerId,
      followingId,
    });
  }
}

async function seed() {
  const usernameToId = new Map<string, string>();

  const demoUser = await db.select().from(users).where(eq(users.username, 'demouser')).limit(1);
  if (demoUser[0]) {
    usernameToId.set('demouser', demoUser[0].id);
  }

  for (const userDef of dummyUsers) {
    const [existingUser] = await db.select().from(users).where(eq(users.username, userDef.username)).limit(1);
    let userRecord = existingUser;

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(userDef.password, 10);
      const inserted = await db.insert(users).values({
        email: userDef.email,
        username: userDef.username,
        passwordHash,
      }).returning();
      userRecord = inserted[0];
    } else {
      const passwordHash = await bcrypt.hash(userDef.password, 10);
      await db.update(users)
        .set({ passwordHash, email: userDef.email })
        .where(eq(users.id, existingUser.id));
      userRecord = existingUser;
    }

    usernameToId.set(userDef.username, userRecord.id);

    const profilePayload = {
      displayName: userDef.displayName,
      bio: userDef.bio,
      avatarUrl: userDef.avatarUrl ?? null,
      showApps: userDef.showApps ?? true,
      isPrivate: userDef.isPrivate ?? false,
      updatedAt: new Date(),
    };

    const [existingProfile] = await db.select().from(profiles).where(eq(profiles.userId, userRecord.id)).limit(1);

    if (existingProfile) {
      await db.update(profiles)
        .set(profilePayload)
        .where(eq(profiles.userId, userRecord.id));
    } else {
      await db.insert(profiles).values({
        userId: userRecord.id,
        ...profilePayload,
      });
    }

    await db.delete(installedApps).where(eq(installedApps.userId, userRecord.id));

    if (userDef.apps.length > 0) {
      await db.insert(installedApps).values(
        userDef.apps.map(app => ({
          userId: userRecord.id,
          packageName: app.packageName,
          appName: app.appName,
          appIcon: app.appIcon ?? null,
          platform: app.platform ?? 'android',
          isVisible: app.isVisible ?? true,
        }))
      );
    }
  }

  for (const userDef of dummyUsers) {
    const followerId = usernameToId.get(userDef.username);
    if (!followerId || !userDef.following) continue;

    for (const targetUsername of userDef.following) {
      let targetId = usernameToId.get(targetUsername);
      if (!targetId) {
        const [targetUser] = await db.select().from(users).where(eq(users.username, targetUsername)).limit(1);
        if (targetUser) {
          usernameToId.set(targetUsername, targetUser.id);
          targetId = targetUser.id;
        }
      }

      if (targetId) {
        await ensureFollow(followerId, targetId);
      }
    }
  }

  console.log('Seeded dummy users:', dummyUsers.map(u => ({
    email: u.email,
    username: u.username,
    password: u.password,
  })));

  process.exit(0);
}

seed().catch((error) => {
  console.error('Failed to seed dummy data:', error);
  process.exit(1);
});
