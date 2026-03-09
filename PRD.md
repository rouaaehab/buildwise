# PRD.md – Engineering Rental & Consultation Platform

---

## 1. Product Overview

### 1.1 Product Name (buildwise)

**EngiRent** – Engineering Rental & Consultation Platform

### 1.2 Product Description

EngiRent is a web-based platform that allows clients to **rent engineers** for consultations or short-term engineering services. Clients can browse engineers based on expertise, ratings, and past projects, while engineers can showcase their portfolios and manage consultations.

The platform provides a structured, trusted, and professional environment for engineering services.

---

## 2. Problem Statement

Clients face difficulties in finding qualified engineers, verifying their experience, and arranging consultations efficiently. Engineers, on the other hand, lack a dedicated platform to professionally showcase their work and manage client interactions.

There is no centralized system focused solely on **engineering rental services** with integrated profiles, ratings, booking, and communication.

---

## 3. Goals & Objectives

### 3.1 Primary Goal

To build a secure and user-friendly platform that connects clients with engineers based on skills, ratings, and past projects.

### 3.2 Objectives

* Enable engineers to create detailed professional profiles
* Allow clients to compare engineers using ratings and portfolios
* Support online consultation booking
* Provide real-time chat between clients and engineers
* Improve trust and transparency in engineering services

---

## 4. User Personas

### 4.1 Client

* Individuals or companies seeking engineering consultation
* Wants verified engineers with proven experience

### 4.2 Engineer

* Professional engineers offering consultation services
* Wants visibility, credibility, and structured client management

### 4.3 Admin (Optional)

* Platform administrator
* Manages users and content moderation

---

## 5. User Roles & Permissions

| Role     | Permissions                                                |
| -------- | ---------------------------------------------------------- |
| Client   | Browse engineers, book consultations, chat, rate engineers |
| Engineer | Create profile, upload projects, manage bookings, chat     |
| Admin    | Approve engineers, manage users, monitor activity          |

---

## 6. Core Features (Functional Requirements)

### 6.1 Authentication

* User registration (Client / Engineer)
* Login & logout
* Role-based access control

### 6.2 Engineer Profile Management

* Personal and professional information
* Skills & specialization
* Portfolio (images, descriptions, external 3D links)
* Availability schedule

### 6.3 Engineer Discovery

* Browse engineers
* Filter by category, rating, expertise
* View detailed profiles

### 6.4 Booking System

* Request consultation
* Select date and time
* Zoom link integration (external)
* Booking status tracking

### 6.5 Rating & Review System

* Clients can rate engineers after consultation
* Written feedback
* Average rating displayed on profiles

### 6.6 Chat System

* Real-time messaging between client and engineer
* Chat history storage

### 6.7 Admin Features (Optional)

* Engineer profile approval
* User management
* Content moderation

---

## 6.8 Dashboards (By Role)

Each role has a dedicated dashboard after login. Below is what each user type sees.

### 6.8.1 Client Dashboard

* **My bookings** – List of consultation requests (pending, confirmed, completed, cancelled)
* **My chats** – Quick access to conversations with engineers
* **Browse engineers** – Link to discovery / search
* **My reviews** – Reviews the client has left for engineers
* **Profile / account settings** – Update name, email, password

### 6.8.2 Engineer Dashboard

* **My profile** – Edit profile, skills, portfolio, availability
* **My bookings** – Incoming and outgoing consultation requests; accept / reject
* **My chats** – Conversations with clients
* **My reviews** – Ratings and feedback received
* **Portfolio / projects** – Add, edit, remove project entries
* **Profile / account settings** – Update name, email, password

### 6.8.3 Admin Dashboard

* **Engineer approval** – Approve or reject engineer profiles before they go live
* **User management** – View, suspend, or manage clients and engineers
* **Content moderation** – Moderate reviews, reports, or inappropriate content
* **Platform overview** – Basic stats (e.g. total users, bookings, engineers)

---

## 7. Non-Functional Requirements

* Security: Authentication, data protection
* Performance: Fast page loading
* Scalability: Support growing users
* Usability: Clean and intuitive UI
* Availability: 24/7 access

---

## 8. Technology Stack

### Frontend

* React
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* Supabase (PostgreSQL)

### Realtime Services

* Supabase Realtime (Chat)

### External Services

* Zoom (meeting links)

---

## 9. System Architecture (High-Level)

Client (Browser)
→ React Frontend
→ Node.js API (Express)
→ Supabase Database

Realtime Communication:
React ↔ Supabase Realtime

---

## 10. Data Models (Simplified)

### Users

* id
* name
* email
* role (client / engineer / admin)

### EngineerProfile

* user_id
* bio
* skills
* experience_years
* rating

### Projects

* engineer_id
* title
* description
* media_url

### Bookings

* client_id
* engineer_id
* datetime
* status
* zoom_link

### Reviews

* booking_id
* rating
* comment

### Messages

* sender_id
* receiver_id
* message
* timestamp

---

# CODING PLAN

---

## Phase 1 – Project Setup

* Initialize Git repository
* Setup Node.js + Express backend
* Setup React frontend
* Configure Supabase project

---

## Phase 2 – Authentication & Roles

* Implement signup/login
* Role-based access middleware
* Session handling

---

## Phase 3 – Engineer Module

* Engineer profile creation
* Portfolio upload
* Profile edit/update

---

## Phase 4 – Client Module

* Engineer browsing
* Filtering & sorting
* Profile viewing

---

## Phase 5 – Booking System

* Booking request flow
* Engineer accept/reject
* Zoom link handling

---

## Phase 6 – Chat System

* Realtime messaging
* Message persistence
* Chat UI

---

## Phase 7 – Rating & Review

* Rating submission
* Rating calculation
* Profile rating display

---

## Phase 8 – Admin (Optional)

* Engineer approval
* User moderation

---

## Phase 9 – Testing & Deployment

* Functional testing
* Security testing
* Deployment (Vercel / Railway)

---

## 11. Future Enhancements

* Payment gateway
* Mobile application
* AI-based engineer recommendations
* 3D model viewer integration

---

**End of PRD.md**
