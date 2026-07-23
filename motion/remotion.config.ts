import {Config} from '@remotion/cli/config';

// Stills/video render on the site's dark canvas so exported assets drop straight in.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// For a transparent overlay asset (motion composited over the dark site background):
//   npm run render:leadflow-webm
