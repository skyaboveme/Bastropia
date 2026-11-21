import type { APIRoute } from 'astro';
import { playlistEmbed, resolveDailyVideo, videoEmbed } from '../../lib/dailyVideo';

export const prerender = false;

export const GET: APIRoute = async () => {
  const video = await resolveDailyVideo();
  const body = video
    ? {
        videoId: video.videoId,
        title: video.title,
        published: video.published,
        embed: videoEmbed(video.videoId),
        fallback: false,
      }
    : {
        videoId: null,
        title: '',
        published: '',
        embed: playlistEmbed,
        fallback: 'playlist',
      };
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
};
