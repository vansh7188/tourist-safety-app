const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true" />
</network-security-config>
`;

module.exports = function withNetworkSecurityConfig(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application) {
      application['android:usesCleartextTraffic'] = 'true';
      application['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return mod;
  });

  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const resDirectory = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res');
      const xmlDirectory = path.join(resDirectory, 'xml');
      fs.mkdirSync(xmlDirectory, { recursive: true });
      fs.writeFileSync(path.join(xmlDirectory, 'network_security_config.xml'), networkSecurityConfig);
      return mod;
    },
  ]);
};