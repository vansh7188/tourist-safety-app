# Admin Dashboard - Testing Guide

## Pre-Testing Checklist

- [ ] MongoDB is running and connected
- [ ] Backend server started on port 5000
- [ ] Frontend development server running
- [ ] Default admin seed script executed: `node seedAdmin.js`
- [ ] No console errors in browser or terminal

---

## Test Cases

### 1. Admin Login

**Test 1.1: Successful Login**
```
Steps:
1. Navigate to http://localhost:5173/admin/login
2. Enter email: admin@safe-travel.com
3. Enter password: Admin@123
4. Click Login

Expected Result:
✓ Redirect to /admin/dashboard
✓ Token stored in localStorage
✓ Admin info displayed in header
```

**Test 1.2: Invalid Credentials**
```
Steps:
1. Navigate to http://localhost:5173/admin/login
2. Enter email: wrong@email.com
3. Enter password: WrongPassword
4. Click Login

Expected Result:
✓ Error message displayed
✓ Remain on login page
✓ No redirect occurs
```

**Test 1.3: Empty Fields**
```
Steps:
1. Navigate to http://localhost:5173/admin/login
2. Leave email and password empty
3. Click Login

Expected Result:
✓ Browser validation error
✓ Form not submitted
```

---

### 2. Dashboard Display

**Test 2.1: Statistics Cards Load**
```
Steps:
1. Login successfully
2. Wait for dashboard to load

Expected Result:
✓ All 6 stats cards visible (Total, Pending, In Progress, Resolved, Critical, High)
✓ Numbers are non-negative integers
✓ Cards have proper icons and colors
```

**Test 2.2: Panic Table Loads**
```
Steps:
1. Login successfully
2. Scroll down to panic table

Expected Result:
✓ Table headers visible
✓ Panic records displayed in rows
✓ All columns visible: User, Contact, Issue, Priority, Status, Date, Action
✓ Pagination showing correct count
```

**Test 2.3: Empty Dashboard**
```
Steps:
1. If no panic requests exist, login

Expected Result:
✓ Stats show all zeros
✓ Table displays "No panic requests found" message
```

---

### 3. Search Functionality

**Test 3.1: Search by Name**
```
Prerequisite: At least one panic request exists
Steps:
1. Navigate to search box
2. Type a user's name (partial or full)
3. Observe results update

Expected Result:
✓ Results filtered to matching names
✓ Results update in real-time
✓ Pagination resets to page 1
```

**Test 3.2: Search by Email**
```
Steps:
1. Type email address or part of it
2. Observe results

Expected Result:
✓ Results filtered to matching emails
✓ Case-insensitive matching
```

**Test 3.3: Search by Contact Number**
```
Steps:
1. Type phone number
2. Observe results

Expected Result:
✓ Results filtered to matching phone numbers
```

**Test 3.4: Search by Issue**
```
Steps:
1. Type keywords from panic query
2. Observe results

Expected Result:
✓ Results filtered to matching issues
✓ Works with partial keywords
```

**Test 3.5: Clear Search**
```
Steps:
1. Enter search term
2. Clear the search box (select all and delete)
3. Observe results

Expected Result:
✓ All results display again
✓ No filter applied
```

---

### 4. Filter Functionality

**Test 4.1: Filter by Status**
```
Steps:
1. Select "Pending" from Status dropdown

Expected Result:
✓ Only pending requests displayed
✓ Status column shows "Pending" for all rows
✓ Page refreshes with new filter
```

**Test 4.2: Filter by Priority**
```
Steps:
1. Select "Critical" from Priority dropdown

Expected Result:
✓ Only critical priority requests displayed
✓ Priority column shows "critical" badge for all
```

**Test 4.3: Combine Filters**
```
Steps:
1. Set Status to "in_progress"
2. Set Priority to "high"

Expected Result:
✓ Only requests with BOTH in_progress AND high priority shown
✓ Results narrowed appropriately
```

**Test 4.4: Clear Filters**
```
Steps:
1. Apply filters
2. Set Status to "All Status" and Priority to "All Priorities"

Expected Result:
✓ All requests displayed again
```

---

### 5. Sort Functionality

**Test 5.1: Sort by Created Date**
```
Steps:
1. Set "Sort By" to "Created Date"
2. Set "Order" to "Newest First"

Expected Result:
✓ Panics ordered with newest first
✓ Dates decrease as you go down
```

**Test 5.2: Sort by Priority**
```
Steps:
1. Set "Sort By" to "Priority"

Expected Result:
✓ Panics sorted by priority (critical first)
```

**Test 5.3: Sort by Status**
```
Steps:
1. Set "Sort By" to "Status"

Expected Result:
✓ Panics sorted by status type
```

---

### 6. Pagination

**Test 6.1: First Page**
```
Steps:
1. Dashboard shows first page

Expected Result:
✓ "Previous" button disabled
✓ Shows "Page 1 of X"
✓ Shows correct item count (up to 10)
```

**Test 6.2: Navigate Pages**
```
Steps:
1. Click "Next" button
2. Observe page number changes
3. Click "Previous" button

Expected Result:
✓ Page number updates
✓ Different items shown on each page
✓ Navigation buttons enable/disable appropriately
```

**Test 6.3: Last Page**
```
Steps:
1. Click "Next" multiple times to reach last page

Expected Result:
✓ "Next" button disabled
✓ Shows correct last page number
✓ Item count is less than or equal to 10
```

---

### 7. View Panic Details

**Test 7.1: Open Details**
```
Steps:
1. Click "View" button on any panic request

Expected Result:
✓ Redirect to /admin/panics/:id page
✓ All details load correctly
```

**Test 7.2: User Information Section**
```
Steps:
1. On details page, look at user info section

Expected Result:
✓ Name displayed
✓ Email displayed
✓ Contact number displayed
✓ KYC type displayed
```

**Test 7.3: Emergency Contacts Section**
```
Steps:
1. Look at emergency contacts section

Expected Result:
✓ All contacts listed
✓ Contact name displayed
✓ Relation displayed
✓ Phone number displayed
```

**Test 7.4: Panic Details Section**
```
Steps:
1. Look at panic details

Expected Result:
✓ Issue/query displayed
✓ Locations listed with addresses
✓ Coordinates shown (if available)
```

---

### 8. Update Panic Status

**Test 8.1: Change Status**
```
Steps:
1. On details page, find status dropdown in right sidebar
2. Change from "pending" to "in_progress"
3. Click "Update"

Expected Result:
✓ Status updated successfully
✓ Success message displayed
✓ Status field reflects change
✓ Timestamp updated
```

**Test 8.2: Change Priority**
```
Steps:
1. On details page, change priority dropdown
2. Set to "critical"
3. Click "Update"

Expected Result:
✓ Priority updated
✓ Success message shown
✓ Priority badge changes
```

**Test 8.3: Add Admin Notes**
```
Steps:
1. On details page, add text to "Admin Notes" textarea
2. Example: "User is safe, resolved via phone contact"
3. Click "Update"

Expected Result:
✓ Notes saved
✓ Confirmation displayed
✓ Notes persist on refresh
```

**Test 8.4: Mark as Resolved**
```
Steps:
1. Click "Mark as Resolved" quick action button

Expected Result:
✓ Status changes to "resolved"
✓ Update button highlighted
✓ ResolvedAt timestamp set
```

**Test 8.5: Mark High Priority**
```
Steps:
1. Click "Mark High Priority" quick action button

Expected Result:
✓ Status changes to "in_progress"
✓ Priority changes to "high"
```

---

### 9. Dashboard Statistics

**Test 9.1: Start Fresh**
```
Prerequisite: Database with multiple panic requests
Steps:
1. Dashboard stats should show:
   - Total count
   - Breakdown by status
   - Critical/High priority counts

Expected Result:
✓ All stats display
✓ Numbers are accurate
✓ Stats update after status changes
```

**Test 9.2: Recent Panics**
```
Steps:
1. Check if recent panics showing (if available)

Expected Result:
✓ Most recent 5 panics listed
✓ Admin name shown if assigned
```

---

### 10. Navigation & UI

**Test 10.1: Back Button**
```
Steps:
1. On panic details page, click "Back" button

Expected Result:
✓ Returns to dashboard
✓ Maintains filters/search state
```

**Test 10.2: Logout**
```
Steps:
1. In header, click "Logout"

Expected Result:
✓ Redirected to /admin/login
✓ Token removed from localStorage
✓ Session ends
```

**Test 10.3: Responsive Design**
```
Steps:
1. Open dashboard on desktop (1920px)
2. Open dashboard on tablet (768px)
3. Open dashboard on mobile (375px)

Expected Result:
✓ Layout adapts properly
✓ No overflow or broken elements
✓ Touch targets adequate
```

**Test 10.4: Loading States**
```
Steps:
1. Perform actions that load data (login, view details)
2. Observe loading indicators

Expected Result:
✓ Spinner shown while loading
✓ Buttons disabled appropriately
✓ No duplicate requests
```

---

### 11. Error Handling

**Test 11.1: Invalid URL**
```
Steps:
1. Try to access /admin/panics/invalid-id

Expected Result:
✓ Error message: "Panic request not found"
✓ Back button available
```

**Test 11.2: No Authentication**
```
Steps:
1. Clear localStorage
2. Try to access /admin/dashboard directly

Expected Result:
✓ Redirect to /admin/login
✓ No data displayed
```

**Test 11.3: Network Error**
```
Steps:
1. Disable internet temporarily
2. Try to perform action

Expected Result:
✓ Error message displayed
✓ Appropriate error text
✓ Retry option available
```

---

### 12. Data Validation

**Test 12.1: Required Fields**
```
Steps:
1. Open panic details page
2. Leave required fields empty
3. Try to update

Expected Result:
✓ Form validation error
✓ Cannot update without required fields
```

**Test 12.2: Max Character Limits**
```
Steps:
1. Try to enter extremely long notes

Expected Result:
✓ Field handles long text gracefully
✓ No overflow or display issues
```

---

### 13. Performance

**Test 13.1: Load Time**
```
Steps:
1. Dashboard loads
2. Note time taken

Expected Result:
✓ Dashboard loads within 2-3 seconds
✓ Smooth interaction
```

**Test 13.2: Search Performance**
```
Steps:
1. Type quickly in search box
2. Observe filtering

Expected Result:
✓ Results update without lag
✓ No UI freezing
✓ Pagination works smoothly
```

**Test 13.3: Memory Usage**
```
Steps:
1. Open developer tools > Performance
2. Perform actions
3. Check memory

Expected Result:
✓ No memory leaks
✓ Smooth performance
```

---

## Test Results Template

```
Test Case: ____________________
Date: ____________
Tester: ____________
Status: [ ] PASS  [ ] FAIL
Comments: ____________________
Severity: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
```

---

## Reporting Issues

When testing, if you find issues:

1. **Document the Issue**
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS details
   - Screenshots (if applicable)

2. **Check Logs**
   - Browser console (F12)
   - Backend terminal
   - MongoDB logs

3. **Common Issues**
   - Check MongoDB connection
   - Verify API endpoints
   - Check token validity
   - Review permissions

---

## Sign-Off

- [ ] All test cases completed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Ready for production

**Tested By**: _______________  
**Date**: _______________  
**Version**: 1.0  
