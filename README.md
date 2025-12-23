# Pixurebyte
<p align="center">
  <img src="https://raw.githubusercontent.com/fish-not-phish/pixurebyte/refs/heads/main/public/pixurebyte-full-light.png" alt="Pixurebyte Logo" width="400"/>
</p>

**Pixurebyte** is an open-source, self-hostable website capture and analysis platform — inspired by URLScan but built for speed, control, and privacy.

Unlike traditional web scanners that struggle with Cloudflare or bot-protection challenges, Pixurebyte allows you to **bypass challenge pages entirely** by hosting your own compute infrastructure.  
You get **screenshots, metadata, and raw HTML** of any site in minutes — all while maintaining full control of your data.

[![Stars](https://img.shields.io/github/stars/fish-not-phish/pixurebyte?style=social)](https://github.com/fish-not-phish/pixurebyte/stargazers)
[![Forks](https://img.shields.io/github/forks/fish-not-phish/pixurebyte?style=social)](https://github.com/fish-not-phish/pixurebyte/network/members)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-Alpha-red)

---

## Key Features

- 🧠 **Self-Hostable Architecture**  
  Run your web app, database, and Redis locally while leveraging AWS for scalable compute and object storage.

- ⚡ **Bypass Cloudflare & Bot Challenges**  
  PixureByte leverages multiple libraries, including [Scrapling](https://github.com/D4Vinci/Scrapling) to assist in bypassing Cloudflare related bot challenges.

- 🖼️ **Full Page Screenshots**  
  Automatically capture high-resolution screenshots of pages.

- 🌐 **Rich Site Metadata Collection**  
  Collect HTML, response/request data, headers, and more.

- 🧩 **Modular & Extensible**  
  Designed for easy integration with your research workflows. New data collectors will be added soon.

- 🔒 **Privacy-Conscious Design**  
  Everything you scan and store stays within your control — nothing is sent to external services.

---

## AWS Compute Model

Pixurebyte uses **AWS ECS Fargate** to launch short-lived scan containers on demand.

- Primary **capacity provider:** `FARGATE_SPOT`
- Fallback: **Standard FARGATE** (if Spot is unavailable)
- Task size: **0.5 vCPU / 2 GB RAM**
- Typical runtime: **~1–3 minutes per scan**

This configuration balances **performance, reliability, and cost efficiency** — giving you full browser capabilities at minimal expense.

---

## Cost Breakdown — How Inexpensive It Really Is

Pixurebyte was designed with a **minimal AWS footprint** in mind.  
All heavy-lifting services (database, web, Redis, API) run **locally** using Docker Compose — meaning you only pay for **ephemeral AWS tasks** and **S3 storage**.

Below is an approximate cost estimate for a modest personal/research deployment:

| Resource | Description | Est. Monthly Cost (USD) |
|-----------|--------------|--------------------------|
| **ECS Fargate Spot Tasks** | 0.5 vCPU / 2 GB RAM per scan, ~2 min average. Spot pricing ≈ $0.0008/min. | **$0.02 – $0.05 per scan** |
| **Fallback Fargate (on-demand)** | Used only if Spot capacity unavailable (~2× cost). | **$0.04 – $0.10 per scan** |
| **S3 Storage** | Screenshots, HTML, and JSON metadata (≈ 10–20 MB per scan). | **$0.02 – $0.10 / month** for hundreds of scans |
| **CloudFront (optional)** | CDN delivery for public image access. | **Free (under free tier)** or ~$0.01/GB |
| **AWS Data Transfer** | Negligible due to CDN usage. | **<$0.10 / month** |

> 💡 **Total cost for light usage:** under **$1 per month** for ~100 scans.  
> Even at moderate scale (hundreds per week), expect costs under **$5–10/month**.  
> The bulk of your infrastructure — API, DB, Redis, and frontend — runs free on your own hardware.

---

## System Overview

Pixurebyte is composed of two parts:

| Component | Description |
|------------|-------------|
| **Local Stack** | Django backend, Redis, PostgreSQL, and frontend served locally via Docker Compose |
| **AWS Infrastructure** | S3 for media storage + ECS Fargate for ephemeral scan workers |

This hybrid model allows **fast local management** with **elastic remote compute**.

---

## Prerequisites

Before installing, make sure you have:

- [Terraform](https://developer.hashicorp.com/terraform/downloads) ≥ **1.6.0**
- [AWS CLI](https://aws.amazon.com/cli/) (configured with credentials)
- [Docker](https://docs.docker.com/get-docker/)
- [OpenSSL](https://www.openssl.org/) (used for generating Django secret keys)

---

## Installation

## Installing Terraform (Linux)

To run OvB's infrastructure components, you’ll need [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli). Here's how to install it on a Debian-based Linux system (e.g. Ubuntu):

**1. Update and install prerequisites**
```bash
sudo apt-get update -y && sudo apt-get install -y gnupg software-properties-common
```
**2. Install the HashiCorp GPG Key**
```bash
wget -O- https://apt.releases.hashicorp.com/gpg | \
gpg --dearmor | \
sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
```
**3. Add the official HashiCorp repository to your linux system.**
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | \
sudo tee /etc/apt/sources.list.d/hashicorp.list
```
**4. Download the package information**
```bash
sudo apt update -y
```
**5. Install Terraform**
```bash
sudo apt-get install -y terraform
```
## AWS Credentials Setup (Root User)

To allow Terraform to authenticate with AWS, you need to provide your **Access Key ID** and **Secret Access Key**. Here's how to obtain them from your AWS Root Account (IAM user is also sufficient):

---

### 1. Sign in to AWS

Go to [https://aws.amazon.com/console/](https://aws.amazon.com/console/) and log in as the **root user** (email + password). Feel free to use an IAM user instead as long as the permissions are correct.

---

### 2. Create Access Keys (for root)

1. Navigate to **My Security Credentials** (top-right dropdown → _“My Security Credentials”_).  
2. Scroll down to the **Access keys** section.  
3. Click **Create access key**.  
4. **Download** or **copy** the credentials safely:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

> ⚠️ You will only see the secret key **once**. Store it securely.

---

### 3. Configure the environment for Terraform

You can pass the credentials via environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="us-east-2"
```

### 4. Clone the Repository
```bash
git clone https://github.com/fishnotphish/pixurebyte.git
cd pixurebyte
```

### 5. Deploy AWS Infrastructure
```
cd terraform
./setup.sh
```

You’ll be prompted for your custom domain and other configuration options.
The script automatically provisions:

- S3 bucket for screenshots and raw HTML
- ECS task definition for scan workers
- CloudFront CDN (so your S3 bucket remains non-public)

Once finished, your AWS resources are ready for use.

### 6. Launch the Local Environment
```
cd ..
docker compose up -d
```

This brings up:

- Django backend (localhost:8000)
- Next.js frontend (localhost:3000)
- Redis + Postgres containers

## Teardown

### Stop Local Services
```
docker compose down
```

To remove all stored data:
```
docker compose down -v
```

### Destroy AWS Infrastructure
```
cd terraform
./destroy.sh
```

This cleanly tears down all provisioned AWS resources (ECS tasks, S3 bucket, etc).

## Disclaimer
> [!CAUTION]
> This library is provided for educational and research purposes only. By using this library, you agree to comply with local and international data scraping and privacy laws. The authors and contributors are not responsible for any misuse of this software. Always respect the terms of service of websites and robots.txt files.