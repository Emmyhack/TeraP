# Booking & Subscription Integration Documentation

## Overview
The TeraP Universal platform now has fully integrated booking and subscription systems that provide a seamless user experience for therapy session management with subscription-based access control.

## Integration Components

### 1. ServiceAccessControlService
- **Purpose**: Central service for subscription validation and access control
- **Key Features**:
  - Subscription status checking (`checkServiceAccess()`)
  - Session booking validation (`canBookSession()`)
  - Minute consumption tracking (`consumeServiceMinutes()`)
  - Payment verification and top-up calculations

### 2. SessionBooking Component Enhanced Features
- **Subscription Status Banner**: Real-time display of subscription tier, remaining minutes, and plan benefits
- **Emergency Session Toggle**: Available for qualifying subscription tiers with premium pricing
- **Usage Statistics**: Monthly progress tracking with visual indicators
- **Smart Cost Calculation**: Automatic pricing based on subscription benefits and remaining minutes
- **Access Validation**: Real-time checking of booking permissions before session creation

### 3. Subscription Tiers Integration
- **Basic (Essential Care)**: 120 minutes/month, no emergency access
- **Standard (Complete Care)**: 300 minutes/month, 15% emergency discount, priority booking
- **Premium (Premium Care)**: 600 minutes/month, 25% emergency discount, 24/7 support
- **Enterprise (Organization Care)**: 1200 minutes/month, 50% emergency discount, unlimited features

## How It Works Together

### 1. User Accesses Booking Page
```
SessionBooking component loads → 
ServiceAccessControlService.checkServiceAccess() →
Displays subscription status banner with current plan details
```

### 2. Session Booking Flow
```
User selects therapist & session type →
System checks subscription minutes via canBookSession() →
Calculates cost based on subscription benefits →
Handles payment (free if minutes available, top-up if needed) →
Books session and consumes minutes via consumeServiceMinutes()
```

### 3. Emergency Sessions
```
User toggles emergency session (if subscription allows) →
System applies emergency rates with subscription discounts →
Priority scheduling and immediate availability activated
```

### 4. Subscription Management
```
No subscription/expired → "Subscribe Now" button → 
Redirects to /client/subscription →
User selects plan and pays →
Returns to booking with activated subscription
```

## Key Features

### Real-Time Integration
- Subscription status is checked on page load and before each booking attempt
- Minutes are consumed in real-time after successful session booking
- Top-up payments are calculated automatically when minutes are insufficient

### Smart Pricing
- Free sessions when subscription minutes are available
- Automatic top-up calculations for overage minutes
- Emergency session premiums with subscription discounts applied
- Clear cost breakdown showing regular vs emergency rates

### User Experience
- Visual subscription status with progress bars for minute usage
- Emergency session toggle only appears for qualifying subscriptions
- Usage statistics showing monthly consumption and remaining benefits
- Seamless navigation between booking and subscription management

### Access Control
- Prevents booking without valid subscription or payment
- Validates therapist availability and session types
- Enforces subscription limits (concurrent sessions, emergency access)
- Handles expired subscriptions gracefully

## Technical Implementation

### State Management
```typescript
// Subscription state in SessionBooking
const [serviceAccess, setServiceAccess] = useState<any>(null);
const [subscriptionLoading, setSubscriptionLoading] = useState(true);
const [isEmergencySession, setIsEmergencySession] = useState(false);
const [topUpRequired, setTopUpRequired] = useState(0);
```

### Cost Calculation Logic
```typescript
const calculateTotalCost = () => {
  // Use remaining minutes first (free)
  // Calculate top-up for additional minutes needed
  // Apply emergency rates and subscription discounts
  // Return final cost in TERAP tokens
};
```

### Booking Validation
```typescript
const handleBookSession = async () => {
  // Check if user can book (subscription + minutes)
  // Handle top-up payment if needed
  // Create encrypted session
  // Consume subscription minutes
  // Redirect to session or confirmation
};
```

## Benefits

### For Users
- Clear understanding of subscription benefits and usage
- No surprise charges - transparent pricing with subscription credits
- Emergency access for premium subscribers
- Usage tracking to manage monthly consumption

### For Platform
- Guaranteed revenue through subscription model
- Reduced payment processing for covered sessions
- Clear value proposition for subscription tiers
- Analytics on user engagement and usage patterns

## Error Handling
- Graceful degradation when ServiceAccessControlService is unavailable
- Clear error messages for subscription validation failures
- Fallback pricing when subscription calculations fail
- User guidance for resolving access issues

This integration creates a comprehensive subscription-aware booking system that maximizes user experience while ensuring proper access control and revenue management.