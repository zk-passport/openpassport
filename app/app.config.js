require('dotenv').config();

module.exports = {
  "name": "AwesomeProject",
  "displayName": "AwesomeProject",
  "expo": {
    "extra": {
      "eas": {
        "projectId": process.env.EXPO_PROJECT_ID,
      }
    }
  }
}
