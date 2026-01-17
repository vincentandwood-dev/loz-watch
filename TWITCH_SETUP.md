# Twitch Stream Integration

The map now supports Twitch live streams in location previews. The system automatically converts Twitch URLs to proper embed format.

## Supported Twitch URL Formats

You can store any of these Twitch URL formats in the `cam_embed_url` field:

### Channel Streams (Live)
```
https://www.twitch.tv/channelname
```
Example: `https://www.twitch.tv/shroud`

### Videos
```
https://www.twitch.tv/videos/VIDEO_ID
```
Example: `https://www.twitch.tv/videos/1234567890`

### Clips
```
https://clips.twitch.tv/CLIP_ID
```
or
```
https://www.twitch.tv/channelname/clip/CLIP_ID
```

## How It Works

1. When a location has a `cam_embed_url` with a Twitch URL, the system automatically:
   - Detects it's a Twitch URL
   - Converts it to the proper embed format
   - Adds the required `parent` parameter (your domain)
   - Configures it for autoplay

2. The embed URL is processed when the location panel opens, ensuring the `parent` parameter matches your current domain.

## Adding Twitch Streams to Locations

### Via Supabase Dashboard
1. Go to your Supabase project
2. Navigate to Table Editor > locations
3. Edit a location's `cam_embed_url` field
4. Paste the Twitch channel/video/clip URL
5. Save

### Example SQL
```sql
UPDATE locations 
SET cam_embed_url = 'https://www.twitch.tv/channelname'
WHERE id = 'your-location-id';
```

## Notes

- **Parent Parameter**: Twitch requires the `parent` parameter to match your domain. This is automatically added based on where the app is hosted.
- **Localhost**: Works in development (localhost is allowed by Twitch)
- **Production**: Make sure your production domain is added to your Twitch app settings if you have one
- **YouTube**: YouTube embed URLs continue to work as before
- **Other Platforms**: Other embed URLs are passed through unchanged

## Troubleshooting

If a Twitch stream doesn't load:
1. Check that the channel is live (for channel URLs)
2. Verify the URL format is correct
3. Check browser console for any CORS or embed errors
4. Ensure the streamer allows embeds (some streamers disable embedding)

