# Use the official PHP-Apache base image
FROM php:8.2-apache

# Enable recommended Apache/PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
 && docker-php-ext-install pdo pdo_pgsql zip

# Copy your app into the container
COPY . /var/www/html/

# If you have a custom apache configuration, place it here or copy it
# e.g. COPY ./apache.conf /etc/apache2/sites-enabled/000-default.conf

# Expose port 80 (important for Render to route traffic)
EXPOSE 80
