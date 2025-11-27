# Requirements Document

## Introduction

The current admin settings page requires non-technical administrators to manually edit JSON key-value pairs, which is confusing and error-prone. Additionally, the settings page styling is inconsistent with the rest of the admin panel, and the Assets navigation item clutters the interface when assets could be managed directly within the page editor. This redesign will transform the settings page into a user-friendly interface with proper controls, validation, and consistent theming, while also removing the standalone Assets page from navigation.

## Requirements

### Requirement 1: User-Friendly Settings Interface

**User Story:** As a non-technical admin, I want to configure site settings using intuitive form controls instead of editing raw JSON, so that I can manage the site without technical knowledge.

#### Acceptance Criteria

1. WHEN an admin views the settings page THEN the system SHALL display settings organized into logical categories with clear labels and descriptions
2. WHEN a setting requires a boolean value THEN the system SHALL display a toggle switch or checkbox control
3. WHEN a setting requires text input THEN the system SHALL display an appropriate text input field with placeholder text and validation
4. WHEN a setting requires numeric input THEN the system SHALL display a number input with min/max constraints where applicable
5. WHEN a setting requires selection from predefined options THEN the system SHALL display a dropdown or radio button group
6. WHEN an admin changes a setting value THEN the system SHALL validate the input before allowing submission
7. WHEN an admin saves settings THEN the system SHALL provide clear success or error feedback
8. WHEN a setting has a default value THEN the system SHALL display the default value and allow resetting to it

### Requirement 2: Consistent Admin Panel Theming

**User Story:** As an admin, I want the settings page to match the visual design of other admin pages, so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. WHEN an admin views the settings page THEN the system SHALL use the same color scheme as other admin pages (background: #F9F9F7, accent: #C19A43, text: #222, #666)
2. WHEN displaying form controls THEN the system SHALL use consistent styling with the rest of the admin panel
3. WHEN displaying headings and labels THEN the system SHALL use the same typography as other admin pages
4. WHEN displaying buttons THEN the system SHALL use the same button styles as other admin pages
5. WHEN displaying cards or sections THEN the system SHALL use consistent spacing, borders, and shadows
6. WHEN displaying success or error messages THEN the system SHALL use the same alert styling as other admin pages

### Requirement 3: Remove Assets Page from Navigation

**User Story:** As an admin, I want a streamlined navigation without the separate Assets page, so that I can focus on core content management tasks.

#### Acceptance Criteria

1. WHEN an admin views the admin navigation THEN the system SHALL NOT display an "Assets" link
2. WHEN an admin views the admin dashboard THEN the system SHALL NOT display an "Assets" card or statistics
3. WHEN an admin needs to manage images THEN the system SHALL provide asset management within the page editor context
4. WHEN accessing /admin/cms/assets directly THEN the system SHALL redirect to an appropriate page (e.g., /admin/cms/pages)
5. WHEN the assets route is removed THEN the system SHALL maintain all existing asset upload and management functionality within the page editor

### Requirement 4: Predefined Setting Types

**User Story:** As a developer, I want to define setting schemas with types and validation rules, so that the UI can automatically render appropriate controls.

#### Acceptance Criteria

1. WHEN a setting is defined in the system THEN it SHALL have a type (boolean, string, number, select, etc.)
2. WHEN a setting is defined THEN it SHALL have a human-readable label and description
3. WHEN a setting is defined THEN it SHALL optionally have validation rules (required, min, max, pattern, etc.)
4. WHEN a setting is defined THEN it SHALL optionally have a default value
5. WHEN a setting is of type "select" THEN it SHALL have a list of valid options with labels
6. WHEN a setting is defined THEN it SHALL optionally belong to a category for organization
7. WHEN the settings page loads THEN the system SHALL render controls based on the setting definitions

### Requirement 5: Settings Categories and Organization

**User Story:** As an admin, I want settings grouped into logical categories, so that I can easily find and manage related settings.

#### Acceptance Criteria

1. WHEN an admin views the settings page THEN the system SHALL display settings grouped by category
2. WHEN displaying categories THEN the system SHALL show category names and descriptions
3. WHEN a category has multiple settings THEN the system SHALL display them in a logical order
4. WHEN there are many categories THEN the system SHALL provide a way to navigate between them (tabs or sections)
5. WHEN a category is empty THEN the system SHALL NOT display it

### Requirement 6: Setting Value Persistence

**User Story:** As an admin, I want my setting changes to be saved reliably to the database, so that my configurations persist across sessions.

#### Acceptance Criteria

1. WHEN an admin saves a setting THEN the system SHALL store the value in the cms_settings table
2. WHEN storing a setting value THEN the system SHALL maintain backward compatibility with the existing value_json column
3. WHEN a setting doesn't exist in the database THEN the system SHALL use the default value from the schema
4. WHEN a setting is saved THEN the system SHALL update the updated_at timestamp
5. WHEN multiple admins edit settings concurrently THEN the system SHALL handle conflicts gracefully
6. WHEN a setting save fails THEN the system SHALL display a clear error message and not lose the user's input

### Requirement 7: Security and Validation

**User Story:** As a system administrator, I want setting changes to be validated and audited, so that the system remains secure and changes are traceable.

#### Acceptance Criteria

1. WHEN an admin submits a setting change THEN the system SHALL validate the input against the setting schema
2. WHEN validation fails THEN the system SHALL display specific error messages indicating what needs to be corrected
3. WHEN a setting is saved THEN the system SHALL log the change in the audit_logs table
4. WHEN accessing the settings API THEN the system SHALL require admin authentication
5. WHEN a setting value could be dangerous (e.g., HTML content) THEN the system SHALL sanitize the input
6. WHEN rate limiting is enabled THEN the system SHALL apply it to settings API endpoints

### Requirement 8: Migration from Current System

**User Story:** As a developer, I want existing settings to work with the new interface, so that the transition is seamless.

#### Acceptance Criteria

1. WHEN the new settings page is deployed THEN existing settings in the database SHALL continue to work
2. WHEN a setting exists in the database but not in the schema THEN the system SHALL display it as a legacy setting with JSON editing
3. WHEN a setting is defined in the schema but not in the database THEN the system SHALL use the default value
4. WHEN migrating THEN the system SHALL NOT require manual data migration
5. WHEN both old and new settings coexist THEN the system SHALL handle both gracefully
