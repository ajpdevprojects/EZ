# 04_ENGINEERING_CANON.md

**Project:** EZ --- Your Personal Job Search Assistant

**Version:** 1.0 (Foundation Freeze)\
**Status:** 🔒 FROZEN\
**Authority:** Founder Approved\
**Phase:** 4 --- Engineering Canon

------------------------------------------------------------------------

# Purpose

The Engineering Canon defines **how EZ is built**.

Where the Product Philosophy defines **why**, the Experience Canon
defines **how it should feel**, and the Design Canon defines **how it
should look**, the Engineering Canon defines **how every feature must be
implemented**.

This document is the permanent engineering source of truth.

------------------------------------------------------------------------

# Canon Hierarchy

Engineering must always follow this order:

1.  Product Philosophy
2.  Experience Canon
3.  Design Canon
4.  Engineering Canon

Implementation may never violate a higher canon.

------------------------------------------------------------------------

# Engineering Philosophy

Engineering exists to make the product disappear.

Users should experience outcomes---not technology.

Every implementation should be:

-   Invisible
-   Reliable
-   Predictable
-   Secure
-   Fast
-   Maintainable

------------------------------------------------------------------------

# Core Engineering Principles

## User First

Every technical decision must improve the user experience.

## Simplicity Over Cleverness

Prefer readable, maintainable solutions over complex ones.

## Consistency

The same problem should be solved the same way across the product.

## Performance by Default

Performance is a requirement, not an optimization.

## Reliability

Features must work consistently before new features are added.

------------------------------------------------------------------------

# Architecture Principles

-   Modular architecture
-   Clear separation of concerns
-   Reusable components
-   Shared design system
-   Centralized business logic
-   Strong typing
-   API-first thinking

------------------------------------------------------------------------

# AI Engineering

AI is an assistant---not the product.

Every AI action must:

-   Explain recommendations
-   Respect user control
-   Request permission for impactful actions
-   Fail gracefully
-   Preserve context where appropriate

------------------------------------------------------------------------

# Data Principles

Data belongs to the user.

Engineering must prioritize:

-   Privacy
-   Security
-   Encryption
-   Minimal data collection
-   Transparent handling

------------------------------------------------------------------------

# Performance Standards

Every release should target:

-   Fast startup
-   Responsive interactions
-   Smooth animations
-   Efficient API usage
-   Lazy loading where appropriate

------------------------------------------------------------------------

# Code Quality

All production code should be:

-   Typed
-   Documented where necessary
-   Tested
-   Reviewed
-   Reusable
-   Free of unnecessary duplication

------------------------------------------------------------------------

# Error Handling

Errors should:

-   Never expose internal implementation
-   Explain the problem clearly
-   Offer recovery when possible
-   Log sufficient diagnostic information

------------------------------------------------------------------------

# Accessibility

Engineering must support:

-   Keyboard navigation
-   Screen readers
-   Sufficient contrast
-   Focus management
-   Responsive layouts

Accessibility is a product requirement.

------------------------------------------------------------------------

# Security

Every feature should follow secure-by-default principles.

Include:

-   Authentication
-   Authorization
-   Input validation
-   Secure storage
-   Least-privilege access

------------------------------------------------------------------------

# Testing Strategy

Every release should validate:

-   Unit tests
-   Integration tests
-   End-to-end workflows
-   Regression testing
-   Manual founder validation

------------------------------------------------------------------------

# Release Philosophy

Ship only when:

-   Product Philosophy is respected.
-   Experience remains effortless.
-   Design remains consistent.
-   Engineering quality standards are met.

Quality takes precedence over speed.

------------------------------------------------------------------------

# Governance

Future engineering decisions should be evaluated with one question:

> Does this implementation move the user closer to getting hired while
> preserving trust, simplicity, and reliability?

If not, it should be redesigned.

------------------------------------------------------------------------

# Engineering Canon Freeze

This document is the permanent engineering blueprint for EZ.

Future technologies may evolve, but these principles remain stable
unless amended through an approved Founder Review.

**Status:** 🔒 FROZEN
