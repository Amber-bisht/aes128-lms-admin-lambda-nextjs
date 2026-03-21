
module.exports = {
    apps: [{
        name: "lms-service",
        script: "./dist/index.js",
        cwd: "./apps/lms-service",
        env: {
            NODE_ENV: "production",
            PORT: 5002
        }
    }]
}
