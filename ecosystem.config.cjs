/**
 * PM2 Ecosystem Configuration for ISCI Management System
 *
 * This file configures how PM2 manages the application process.
 *
 * IMPORTANT: React Router v7 requires using 'npm start' (react-router-serve)
 * instead of running the build file directly with node.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart isci-mgmt
 *   pm2 stop isci-mgmt
 *   pm2 logs isci-mgmt
 */

module.exports = {
  apps: [{
    // Application name
    name: "isci-mgmt",

    // Use npm start to run react-router-serve
    script: "npm",
    args: "start",

    // Working directory
    cwd: "/var/www/isci-mgmt-system",

    // Use fork mode (not cluster) for npm commands
    instances: 1,
    exec_mode: "fork",

    // Environment variables
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },

    // Auto restart configuration
    autorestart: true,
    watch: false,  // Don't watch files in production (use pm2 restart instead)
    max_memory_restart: "500M",  // Restart if memory exceeds 500MB

    // Logging
    error_file: "/var/www/isci-mgmt-system/logs/pm2-error.log",
    out_file: "/var/www/isci-mgmt-system/logs/pm2-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true
  }]
};
