import React from 'react';
import {Composition} from 'remotion';
import {LeadFlow} from './LeadFlow';

// Compositions render in the Secret Systems palette so exported assets match the site.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LeadFlow"
        component={LeadFlow}
        durationInFrames={180}
        fps={30}
        width={880}
        height={1040}
      />
    </>
  );
};
