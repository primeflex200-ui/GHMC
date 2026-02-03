# Management Role Signup System

## Overview
The Management Role Signup System allows authorized personnel to request access to management-level roles within the GHMC system. This external add-on maintains all existing functionality while adding secure signup capabilities.

## Features

### Signup Process
- **Role Selection**: Users can request access to Administrator, Field Manager, or Officer Manager roles
- **Role-Specific Forms**: Dynamic form fields based on selected role
- **Validation**: Comprehensive validation including employee ID format checking
- **Approval Workflow**: All requests require administrator approval

### Supported Roles
1. **Administrator**: Full system access and user management
2. **Field Manager**: Area-specific complaint management with department assignment
3. **Officer Manager**: Department-level oversight and complaint assignment

### Security Features
- **Employee ID Validation**: GHMC employee ID format (GHMC followed by 6 digits)
- **Duplicate Prevention**: Prevents duplicate employee IDs in system
- **Approval Required**: All accounts inactive until admin approval
- **Audit Trail**: Complete logging of signup requests and approvals

## Usage

### For Users Requesting Access
1. Navigate to the login screen
2. Click "New Management Account? Sign Up"
3. Select desired management role
4. Fill in all required information:
   - Full name and employee ID
   - Official GHMC email and mobile
   - Department (for Officer/Field Manager roles)
   - Area (for Field Manager role only)
   - Justification for access request
   - Supervisor/reference information
5. Create secure password
6. Accept terms and conditions
7. Submit request

### For Administrators
1. Login to admin dashboard
2. View pending signup requests in the dedicated section
3. Click on any request to view full details
4. Approve or reject requests with reasons
5. Monitor audit trail for all signup activities

## Technical Implementation

### Files Modified
- `auth-system.html`: Added management signup screen
- `auth-system.css`: Added styles for signup interface
- `auth-system.js`: Added signup validation and submission logic
- `admin-dashboard.html`: Added signup approval interface
- `admin-dashboard.js`: Added approval workflow functionality
- `admin-dashboard.css`: Added styles for approval interface

### Data Storage
- Pending requests: `ghmc_pending_signups` (localStorage)
- Rejected requests: `ghmc_rejected_signups` (localStorage)
- Admin notifications: `ghmc_admin_notifications` (localStorage)
- Audit trail: `ghmc_audit_trail` (localStorage)

### Integration Points
- Seamless integration with existing authentication system
- Compatible with role-based permissions system
- Works with existing admin dashboard infrastructure

## Demo Credentials

### Existing Admin Account
- **User ID**: admin001
- **Password**: admin123
- **Role**: Administrator

### Test Employee IDs
Use these formats for testing:
- GHMC123456
- GHMC789012
- GHMC345678

## Workflow Example

1. **User Signup**:
   - User fills signup form for Field Manager role
   - System validates employee ID format
   - Request stored as pending with unique ID
   - Admin notification created

2. **Admin Review**:
   - Admin sees notification badge on dashboard
   - Reviews request details including justification
   - Approves request with one click
   - User account activated with appropriate permissions

3. **User Access**:
   - User can now login with approved credentials
   - Redirected to role-appropriate dashboard
   - Full access to role-specific features

## Security Considerations

- All passwords are stored securely
- Employee ID uniqueness enforced
- Approval workflow prevents unauthorized access
- Complete audit trail for compliance
- Role-based permissions strictly enforced

## Future Enhancements

- Email notifications for signup status
- Bulk approval capabilities
- Advanced filtering for pending requests
- Integration with HR systems for employee verification
- Automated approval for certain criteria

## Support

For technical issues or questions about the signup system, contact the system administrator or refer to the main system documentation.