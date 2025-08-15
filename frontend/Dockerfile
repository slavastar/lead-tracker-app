# frontend/Dockerfile (CRA)
# ----- Builder -----
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build-time args and expose as env so CRA can inline them
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY

# Install deps and build React app
COPY package*.json ./
RUN npm ci
COPY . .
# CRA/Vite/etc.: build outputs to /app/build by default (CRA)
RUN npm run build

# ----- Runtime (Nginx) -----
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=builder /app/build ./

# Copy our nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]