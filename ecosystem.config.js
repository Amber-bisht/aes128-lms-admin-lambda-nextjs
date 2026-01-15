
module.exports = {
    apps: [{
        name: "lms-api",
        script: "./dist/index.js",
        cwd: "./apps/api",
        env: {
            NODE_ENV: "production",
            PORT: 4000
            // Add other env vars here or use --env-file in newer Node versions
            // Or load from .env file using dotenv in code (which we do)
        }
    }]
}
