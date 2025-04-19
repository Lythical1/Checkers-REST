FROM php:8.2-apache

# Install PHP extensions and required packages
RUN apt-get update && apt-get install -y \
    && docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Configure Apache user and permissions
RUN chown -R www-data:www-data /var/www/ \
    && chmod -R 755 /var/www/ \
    && a2enmod headers \
    && a2enmod rewrite

# Copy application code
COPY ./app/frontend/ /var/www/html/