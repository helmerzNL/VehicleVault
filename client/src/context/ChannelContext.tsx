import React, { createContext, useContext, useEffect, useState } from 'react';

export type Channel = 'beta' | 'stable';

interface ChannelContextType {
  channel: Channel;
  version: string;
}

const ChannelContext = createContext<ChannelContextType>({ channel: 'stable', version: `v${__APP_VERSION__.replace(/^v/, '')}` });

const BASE_TITLE = 'VehicleVault';

/** Which build is running (stable or beta) is decided by the server at runtime, from the compose tag. */
export const ChannelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [value, setValue] = useState<ChannelContextType>({
    channel: 'stable',
    version: `v${__APP_VERSION__.replace(/^v/, '')}`,
  });

  useEffect(() => {
    fetch('/api/version')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data.channel === 'beta' || data.channel === 'stable')) {
          setValue({ channel: data.channel, version: `v${String(data.version).replace(/^v/, '')}` });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = value.channel === 'beta' ? `${BASE_TITLE} (beta)` : BASE_TITLE;
  }, [value.channel]);

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
};

export const useChannel = () => useContext(ChannelContext);
