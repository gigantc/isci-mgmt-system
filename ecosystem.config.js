/**
 * PM2 Ecosystem Configuration for ISCI Management System
 *
 * This file configures how PM2 manages the application process.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart isci-mgmt
 *   pm2 stop isci-mgmt
 *   pm2 logs isci-mgmt
 */

module.exports = {
  apps: [{
    // Application name
    name: "isci-mgmt",

    // Entry point - React Router's server entry
    script: "./build/server/index.js",

    // Working directory
    cwd: "/var/www/isci-mgmt-system",

    // Instances - set to "max" to use all CPU cores
    // For t2.small/t3.small (1-2 cores), use 1 or 2
    instances: 1,

    // Execution mode: "cluster" for load balancing, "fork" for single instance
    exec_mode: "cluster",

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
    merge_logs: true,

    // Advanced options
    kill_timeout: 5000,  // Time to wait before force killing process
    listen_timeout: 10000,  // Time to wait for app to listen

    // Restart delays
    min_uptime: "10s",  // Minimum uptime before considered stable
    max_restarts: 10,  // Maximum number of restarts within 1 minute
    restart_delay: 4000,  // Delay between restarts

    // Graceful start/shutdown
    wait_ready: true,  // Wait for process.send('ready') before considering app started
    shutdown_with_message: true
  }]
};
