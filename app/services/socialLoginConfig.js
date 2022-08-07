// export const socialConfig = {
//   enabled: false,
//   socialPlatforms: ["facebook", "google"], // Currently we only support Facebook and Google signin. We'll add more in future
//   google: {
//     webClientId:
//       "845992057495-tboapvm5chbdsa3ptfusdb8ip1kr4sg6.apps.googleusercontent.com",
//   },
//   facebook: {
//     appID: "6786786788687",
//     appName: "YourFBAppName",
//     android: {},
//     iOS: {},
//   },
// };


export const socialConfig = {
  enabled: true,
  socialPlatforms: ["google", "facebook"], // Currently we only support Facebook and Google signin. We'll add more in future
  google: {
    webClientId:
      "845992057495-tboapvm5chbdsa3ptfusdb8ip1kr4sg6.apps.googleusercontent.com",
  },
  facebook: {
    appID: "351236990180813",
    appName: "Just Sale Online",
    android: {
      clientId: "845992057495-jjjfg7rb1qtpbcsqf0jgcbr2q72aoklp.apps.googleusercontent.com"
    },
    iOS: {
      clientId: "845992057495-5ahf6cddnpep4s3tlf7ph9ctrhe6f3bm.apps.googleusercontent.com"
    },
  },
};