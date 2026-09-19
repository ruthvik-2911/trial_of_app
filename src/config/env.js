/**
 * Environment Configuration
 * Centralized store for API keys and environment-specific variables.
 * In a production app, these would be managed via secure environment variables.
 */

export const ENV = {
  // Google Auth
  GOOGLE_WEB_CLIENT_ID: '160879269054-apt5gfnsmmd5ak250m75jd045r5tsr8a.apps.googleusercontent.com',
  GOOGLE_ANDROID_CLIENT_ID: '160879269054-apt5gfnsmmd5ak250m75jd045r5tsr8a.apps.googleusercontent.com',

  // Razorpay
  RAZORPAY_KEY_ID: 'rzp_test_SHwPxTs74SFbLu',
  RAZORPAY_KEY_SECRET: 'cAGBWCZkJhN4AcGaY121N6sC',

  // Gemini AI
  GEMINI_API_KEY: 'AIzaSyBKlG2oyL2YrRCf-TePf8tKn17HGmLAdss',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: 'dhevauth5',
  CLOUDINARY_API_KEY: '511255263888482',
  CLOUDINARY_API_SECRET: 'Lct_38d4lRzzsaY78EyB0KyWLDk',

  // Shiprocket
  SHIPROCKET_EMAIL: 'madhwainfo.devops@gmail.com',
  SHIPROCKET_PASSWORD: 'qu#s^*2zX%CR$eh6u#Co%WYl96pCIk&D',
  SHIPROCKET_API_URL: 'https://apiv2.shiprocket.in/v1/external',
  SHIPROCKET_WEBHOOK_SECRET: 'shiprocket_webhook_secret_2024',

  // URLs
  FRONTEND_URL: 'https://sellsathifrontend.onrender.com',
  BACKEND_URL: 'https://sellsathi-refactored.onrender.com',

  // Debugging
  ALLOW_TEST_UID: true,
};

export default ENV;
