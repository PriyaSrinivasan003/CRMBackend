/**
 * OpenAPI 3.0 Path definitions for all API endpoints
 */
const paths = {
  // ================= HEALTH =================
  '/health': {
    get: {
      tags: ['System Health'],
      summary: 'Liveness probe',
      description: 'Returns server uptime and status',
      security: [],
      responses: {
        200: {
          description: 'Server is healthy'
        }
      }
    }
  },
  '/health/ready': {
    get: {
      tags: ['System Health'],
      summary: 'Readiness probe',
      description: 'Verifies database connectivity',
      security: [],
      responses: {
        200: {
          description: 'Database is connected and ready'
        },
        503: {
          description: 'Database connection failed'
        }
      }
    }
  },

  // ================= AUTH =================
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User Login',
      description: 'Authenticate user with email or mobile number and password',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['identifier', 'password'],
              properties: {
                identifier: {
                  type: 'string',
                  example: 'admin@collectagent.com',
                  description: 'Email or mobile number'
                },
                password: {
                  type: 'string',
                  example: 'Admin@SecurePass2026'
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Login successful' },
        401: { description: 'Invalid login credentials' },
        422: { description: 'Validation failed' }
      }
    }
  },
  '/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh Access Token',
      description: 'Rotate refresh token and issue new access token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Token refreshed successfully' },
        401: { description: 'Token expired or reuse detected' }
      }
    }
  },
  '/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get Current User Profile',
      description: 'Retrieve details of currently logged-in account and associated profile',
      responses: {
        200: { description: 'Profile retrieved' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout Current Session',
      description: 'Revokes the supplied refresh token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Logged out successfully' }
      }
    }
  },
  '/auth/logout-all': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout All Sessions',
      description: 'Revokes all active refresh tokens for the current user',
      responses: {
        200: { description: 'All active sessions terminated' }
      }
    }
  },
  '/auth/change-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Change Account Password',
      description: 'Updates user password and invalidates previous sessions',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string', example: 'Current@Pass123' },
                newPassword: { type: 'string', example: 'New@SecurePass2026' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Password changed successfully' },
        400: { description: 'Current password incorrect' }
      }
    }
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Forgot Password Request',
      description: 'Generates and dispatches a password reset OTP',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['identifier'],
              properties: {
                identifier: { type: 'string', example: 'admin@collectagent.com' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Reset instructions sent if account exists' }
      }
    }
  },
  '/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset Password with OTP',
      description: 'Verifies reset OTP and updates user password',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['identifier', 'otp', 'newPassword'],
              properties: {
                identifier: { type: 'string', example: 'admin@collectagent.com' },
                otp: { type: 'string', example: '123456' },
                newPassword: { type: 'string', example: 'New@SecurePass2026' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Password reset successfully' },
        400: { description: 'Invalid or expired OTP' }
      }
    }
  },
  '/auth/send-email-otp': {
    post: {
      tags: ['Authentication'],
      summary: 'Send Email Verification OTP',
      description: 'Generates and sends a 6-digit verification OTP to the logged-in user\'s email address. Stored directly in the user profile.',
      responses: {
        200: { description: 'Verification OTP sent to email' },
        400: { description: 'Email already verified or missing email' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/auth/verify-email': {
    post: {
      tags: ['Authentication'],
      summary: 'Verify Email with OTP',
      description: 'Verifies the OTP sent to user\'s email and marks email as verified',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['otp'],
              properties: {
                otp: { type: 'string', example: '123456' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Email verified successfully' },
        400: { description: 'Invalid or expired OTP' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/auth/send-mobile-otp': {
    post: {
      tags: ['Authentication'],
      summary: 'Send Mobile Verification OTP',
      description: 'Generates and dispatches a verification OTP to the logged-in user\'s mobile number. Stored directly in the user profile.',
      responses: {
        200: { description: 'Verification OTP sent to mobile' },
        400: { description: 'Mobile already verified or missing mobile number' },
        401: { description: 'Unauthorized' }
      }
    }
  },
  '/auth/verify-mobile': {
    post: {
      tags: ['Authentication'],
      summary: 'Verify Mobile Number with OTP',
      description: 'Verifies the OTP sent to user\'s mobile and marks mobile as verified',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['otp'],
              properties: {
                otp: { type: 'string', example: '123456' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Mobile verified successfully' },
        400: { description: 'Invalid or expired OTP' },
        401: { description: 'Unauthorized' }
      }
    }
  },

  // ================= ORGANIZATIONS =================
  '/organizations': {
    post: {
      tags: ['Organizations'],
      summary: 'Create Organization (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'code'],
              properties: {
                name: { type: 'string', example: 'Apex Collections Corp' },
                code: { type: 'string', example: 'ORG-APEX-001' },
                email: { type: 'string', example: 'info@apexcorp.com' },
                phone: { type: 'string', example: '9876543210' },
                address: { type: 'string', example: '100 Financial District' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Organization created' }
      }
    },
    get: {
      tags: ['Organizations'],
      summary: 'List Organizations',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Organizations retrieved' }
      }
    }
  },
  '/organizations/{id}': {
    get: {
      tags: ['Organizations'],
      summary: 'Get Organization by ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Organization details' }
      }
    },
    patch: {
      tags: ['Organizations'],
      summary: 'Update Organization (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Organization updated' }
      }
    }
  },
  '/organizations/{id}/branches': {
    post: {
      tags: ['Organizations'],
      summary: 'Create Branch directly for Organization (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['branch_code', 'branch_name'],
              properties: {
                branch_code: { type: 'string', example: 'BR-APX-001' },
                branch_name: { type: 'string', example: 'Apex Central Branch' },
                address: { type: 'string', example: 'Tower 4, IT Corridor' },
                city: { type: 'string', example: 'Bangalore' },
                state: { type: 'string', example: 'Karnataka' },
                pincode: { type: 'string', example: '560001' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Branch created for organization' }
      }
    },
    get: {
      tags: ['Organizations'],
      summary: 'List Branches belonging to Organization',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Branches list for organization' }
      }
    }
  },

  // ================= BRANCHES =================
  '/branches': {
    post: {
      tags: ['Branches'],
      summary: 'Create Branch (Admin only)',
      description: 'Creates a new branch associated with an organisation. Also callable as /branches/createBranch.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['branch_code', 'branch_name', 'organisation_id'],
              properties: {
                branch_code: { type: 'string', example: 'BR-DEL-001' },
                branch_name: { type: 'string', example: 'Delhi Central Branch' },
                organisation_id: { type: 'string', example: 'db5a57a538984a7f855e0cc0f88c3a33', description: 'Organisation UUID (e.g. from /organizations)' },
                address: { type: 'string', example: '12 Connaught Place' },
                city: { type: 'string', example: 'New Delhi' },
                state: { type: 'string', example: 'Delhi' },
                pincode: { type: 'string', example: '110001' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Branch created' },
        403: { description: 'Admin only' }
      }
    },
    get: {
      tags: ['Branches'],
      summary: 'List Branches',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'organisation_id', in: 'query', schema: { type: 'string' }, description: 'Filter by Organisation UUID' },
        { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1] } }
      ],
      responses: {
        200: { description: 'Branches retrieved' }
      }
    }
  },
  '/branches/createBranch': {
    post: {
      tags: ['Branches'],
      summary: 'Create Branch (Function Named Route)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['branch_code', 'branch_name', 'organisation_id'],
              properties: {
                branch_code: { type: 'string', example: 'BR-DEL-002' },
                branch_name: { type: 'string', example: 'Delhi South Branch' },
                organisation_id: { type: 'string', example: 'db5a57a538984a7f855e0cc0f88c3a33' },
                address: { type: 'string', example: 'Saket District Centre' },
                city: { type: 'string', example: 'New Delhi' },
                state: { type: 'string', example: 'Delhi' },
                pincode: { type: 'string', example: '110017' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Branch created' }
      }
    }
  },
  '/branches/getAllBranches': {
    get: {
      tags: ['Branches'],
      summary: 'List All Branches (Function Named Route)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'organisation_id', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Branches retrieved' }
      }
    }
  },
  '/branches/{id}': {
    get: {
      tags: ['Branches'],
      summary: 'Get Branch by ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Branch details' },
        404: { description: 'Not found' }
      }
    },
    patch: {
      tags: ['Branches'],
      summary: 'Update Branch (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                branch_name: { type: 'string' },
                address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                pincode: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Branch updated' }
      }
    }
  },

  // ================= USERS =================
  '/users': {
    post: {
      tags: ['Users & Onboarding'],
      summary: 'Create User with Automatic Profile Provisioning (Admin only)',
      description: 'Creates user credentials and atomically provisions related Supervisor or Field Agent profile record in one transaction',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'password', 'role_code'],
              properties: {
                name: { type: 'string', example: 'Ravi Kumar' },
                email: { type: 'string', example: 'ravi.agent@collectagent.com' },
                mobile: { type: 'string', example: '9812345678' },
                password: { type: 'string', example: 'Ravi@Pass2026' },
                role_code: { type: 'string', enum: ['ADMIN', 'SUPERVISOR', 'FIELD_AGENT'], example: 'FIELD_AGENT' },
                employee_code: { type: 'string', example: 'AGT-BLR-001' },
                branch_id: { type: 'string', format: 'uuid' },
                supervisor_id: { type: 'string', format: 'uuid', description: 'Required/optional for field agents' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'User and profile provisioned' },
        409: { description: 'User or employee code already exists' }
      }
    },
    get: {
      tags: ['Users & Onboarding'],
      summary: 'List Users (Admin only)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'SUPERVISOR', 'FIELD_AGENT'] } },
        { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1, 2, 3] } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: { description: 'Users list' }
      }
    }
  },
  '/users/{id}': {
    get: {
      tags: ['Users & Onboarding'],
      summary: 'Get User Details (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'User profile details' }
      }
    },
    patch: {
      tags: ['Users & Onboarding'],
      summary: 'Update User (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                mobile: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'User updated' }
      }
    }
  },
  '/users/{id}/status': {
    patch: {
      tags: ['Users & Onboarding'],
      summary: 'Update User Account Status (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'integer', enum: [0, 1, 2, 3], description: '0: Inactive, 1: Active, 2: Suspended, 3: Locked' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Status updated' }
      }
    }
  },

  // ================= SUPERVISORS =================
  '/supervisors': {
    post: {
      tags: ['Supervisors'],
      summary: 'Create Supervisor (Admin only)',
      description: 'Creates user credentials and atomically provisions Supervisor profile',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'password', 'employee_code'],
              properties: {
                name: { type: 'string', example: 'Amit Sharma' },
                email: { type: 'string', example: 'amit.supervisor@collectagent.com' },
                mobile: { type: 'string', example: '9845123456' },
                password: { type: 'string', example: 'Supervisor@Pass2026' },
                employee_code: { type: 'string', example: 'SUP-DEL-002' },
                branch_id: { type: 'string', example: '9e7cd2fde0d44cd7a7ba62a31ddc1669', description: 'Branch UUID' },
                joining_date: { type: 'string', example: '2026-03-01' },
                address: { type: 'string', example: '45 Green Park, New Delhi' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Supervisor created successfully' },
        409: { description: 'Employee code or email/mobile already exists' }
      }
    },
    get: {
      tags: ['Supervisors'],
      summary: 'List Supervisors (Admin only)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: { description: 'Supervisors list' } }
    }
  },
  '/supervisors/createSupervisor': {
    post: {
      tags: ['Supervisors'],
      summary: 'Create Supervisor (Function Named Route)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'password', 'employee_code'],
              properties: {
                name: { type: 'string', example: 'Priya Sharma' },
                email: { type: 'string', example: 'priya.supervisor@collectagent.com' },
                mobile: { type: 'string', example: '9845123457' },
                password: { type: 'string', example: 'Supervisor@Pass2026' },
                employee_code: { type: 'string', example: 'SUP-DEL-003' },
                branch_id: { type: 'string', example: '9e7cd2fde0d44cd7a7ba62a31ddc1669' },
                joining_date: { type: 'string', example: '2026-03-01' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Supervisor created successfully' }
      }
    }
  },
  '/supervisors/{id}': {
    get: {
      tags: ['Supervisors'],
      summary: 'Get Supervisor Details',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Supervisor profile' }, 403: { description: 'Forbidden' } }
    }
  },
  '/supervisors/{id}/agents': {
    get: {
      tags: ['Supervisors'],
      summary: 'Get Supervisor Team Agents',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Team agents list' } }
    }
  },

  // ================= AGENTS =================
  '/agents': {
    post: {
      tags: ['Field Agents'],
      summary: 'Create Field Agent (Admin only)',
      description: 'Creates user credentials and atomically provisions Field Agent profile linked to supervisor & branch',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'password', 'employee_code'],
              properties: {
                name: { type: 'string', example: 'Vikram Singh' },
                email: { type: 'string', example: 'vikram.agent@collectagent.com' },
                mobile: { type: 'string', example: '9812345679' },
                password: { type: 'string', example: 'Agent@Pass2026' },
                employee_code: { type: 'string', example: 'AGT-DEL-003' },
                supervisor_id: { type: 'string', example: '44fdbb964cff4385af429b3d3ac76bcc', description: 'Supervisor UUID' },
                branch_id: { type: 'string', example: '9e7cd2fde0d44cd7a7ba62a31ddc1669', description: 'Branch UUID' },
                joining_date: { type: 'string', example: '2026-03-01' },
                address: { type: 'string', example: '12 Rohini Sector 9, New Delhi' },
                emergency_contact: { type: 'string', example: '9812345600' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Field agent created successfully' },
        409: { description: 'Employee code or email/mobile already exists' }
      }
    },
    get: {
      tags: ['Field Agents'],
      summary: 'List Agents (Admin, or Supervisor for own team)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: { description: 'Agents list' } }
    }
  },
  '/agents/createAgent': {
    post: {
      tags: ['Field Agents'],
      summary: 'Create Field Agent (Function Named Route)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'password', 'employee_code'],
              properties: {
                name: { type: 'string', example: 'Kunal Verma' },
                email: { type: 'string', example: 'kunal.agent@collectagent.com' },
                mobile: { type: 'string', example: '9812345680' },
                password: { type: 'string', example: 'Agent@Pass2026' },
                employee_code: { type: 'string', example: 'AGT-DEL-004' },
                supervisor_id: { type: 'string', example: '44fdbb964cff4385af429b3d3ac76bcc' },
                branch_id: { type: 'string', example: '9e7cd2fde0d44cd7a7ba62a31ddc1669' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Field agent created successfully' }
      }
    }
  },
  '/agents/{id}': {
    get: {
      tags: ['Field Agents'],
      summary: 'Get Agent Details',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Agent profile' } }
    },
    patch: {
      tags: ['Field Agents'],
      summary: 'Update Agent (Admin or Self)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                emergency_contact: { type: 'string' }
              }
            }
          }
        }
      },
      responses: { 200: { description: 'Agent updated' } }
    }
  },
  '/agents/{id}/customers': {
    get: {
      tags: ['Field Agents'],
      summary: 'Get Assigned Customers Queue for Agent',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Assigned customer list' } }
    }
  },
  '/agents/{id}/collections': {
    get: {
      tags: ['Field Agents'],
      summary: 'Get Collection Visits for Agent',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Agent collection visits' } }
    }
  },

  // ================= CUSTOMERS =================
  '/customers': {
    post: {
      tags: ['Customers'],
      summary: 'Create Customer (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['full_name', 'mobile', 'address_line1', 'branch_id'],
              properties: {
                customer_code: { type: 'string', example: 'CUST-BLR-1001' },
                full_name: { type: 'string', example: 'Mahesh Sharma' },
                mobile: { type: 'string', example: '9845123456' },
                address_line1: { type: 'string', example: '12 Indiranagar 100ft Rd' },
                city: { type: 'string', example: 'Bangalore' },
                branch_id: { type: 'string', format: 'uuid' },
                initial_agent_id: { type: 'string', format: 'uuid' }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Customer created' } }
    },
    get: {
      tags: ['Customers'],
      summary: 'List Customers (Scoped by role)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: { description: 'Customers list' } }
    }
  },
  '/customers/{id}': {
    get: {
      tags: ['Customers'],
      summary: 'Get Customer Details (Ownership checked)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Customer details' }, 403: { description: 'Forbidden' } }
    }
  },
  '/customers/{id}/assignments': {
    post: {
      tags: ['Customers'],
      summary: 'Assign Customer to Agent (Admin/Supervisor)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['agent_id'],
              properties: {
                agent_id: { type: 'string', format: 'uuid' }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Customer assigned' } }
    }
  },

  // ================= COLLECTIONS =================
  '/collections': {
    post: {
      tags: ['Collections'],
      summary: 'Create Collection Visit Record',
      description: 'Field agent records a loan recovery visit for an assigned customer',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'collection_date', 'amount_due'],
              properties: {
                customer_id: { type: 'string', format: 'uuid' },
                collection_date: { type: 'string', example: '2026-09-28' },
                amount_due: { type: 'number', example: 5000.00 },
                remarks: { type: 'string', example: 'Monthly EMI recovery visit' },
                latitude: { type: 'number', example: 12.9716 },
                longitude: { type: 'number', example: 77.5946 }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Collection visit recorded' }, 403: { description: 'Not assigned to customer' } }
    },
    get: {
      tags: ['Collections'],
      summary: 'List Collection Visits',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'collection_status', in: 'query', schema: { type: 'integer', enum: [0, 1, 2, 3, 4] } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: { 200: { description: 'Collection records' } }
    }
  },
  '/collections/summary': {
    get: {
      tags: ['Collections'],
      summary: 'Collection Revenue Summary & Breakdown',
      description: 'Returns total due, total collected, total outstanding, and visit status breakdown',
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: { 200: { description: 'Summary statistics' } }
    }
  },
  '/collections/{id}': {
    get: {
      tags: ['Collections'],
      summary: 'Get Collection Visit Details',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Collection details' } }
    }
  },

  // ================= PAYMENTS =================
  '/payments': {
    post: {
      tags: ['Payments'],
      summary: 'Record Payment (Atomic Balance Synchronization)',
      description: 'Records payment transaction with duplicate protection. Automatically updates collection amount_collected and status.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['collection_id', 'amount', 'payment_method'],
              properties: {
                collection_id: { type: 'string', format: 'uuid' },
                receipt_number: { type: 'string', example: 'RCP-2026-001' },
                amount: { type: 'number', example: 5000.00 },
                payment_method: { type: 'integer', enum: [0, 1, 2, 3], description: '0: Cash, 1: UPI, 2: Bank Transfer, 3: Other' },
                transaction_reference: { type: 'string', example: 'UPI-987654321' },
                collected_at: { type: 'string', format: 'date-time', example: '2026-09-28T10:00:00Z', description: 'When payment was collected' },
                installment_id: { type: 'string', format: 'uuid', description: 'Target installment ID if single allocation' },
                allocations: {
                  type: 'array',
                  description: 'Payment distribution across one or multiple installments',
                  items: {
                    type: 'object',
                    required: ['allocated_amount'],
                    properties: {
                      installment_id: { type: 'string', format: 'uuid' },
                      allocated_amount: { type: 'number', example: 2500.00 }
                    }
                  }
                },
                notes: { type: 'string', example: 'Full cash installment received' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Payment recorded and collection balance updated' },
        409: { description: 'Duplicate receipt or transaction reference' }
      }
    },
    get: {
      tags: ['Payments'],
      summary: 'List Payments',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'payment_status', in: 'query', schema: { type: 'integer', enum: [0, 1, 2, 3] } }
      ],
      responses: { 200: { description: 'Payments list' } }
    }
  },
  '/payments/{id}': {
    get: {
      tags: ['Payments'],
      summary: 'Get Payment Details',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Payment details' } }
    }
  },
  '/payments/{id}/confirm': {
    post: {
      tags: ['Payments'],
      summary: 'Confirm Payment (Admin/Supervisor)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Payment confirmed & balance synchronized' } }
    }
  },
  '/payments/{id}/reverse': {
    post: {
      tags: ['Payments'],
      summary: 'Reverse Payment (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { 200: { description: 'Payment reversed & collection totals recalculated' } }
    }
  },

  // ================= DASHBOARD =================
  '/dashboard/admin': {
    get: {
      tags: ['Dashboards'],
      summary: 'Admin System-Wide Dashboard',
      description: 'System overview: total users, supervisors, agents, customers, revenue, recent visits and transactions',
      responses: { 200: { description: 'Admin statistics' }, 403: { description: 'Admin role required' } }
    }
  },
  '/dashboard/supervisor': {
    get: {
      tags: ['Dashboards'],
      summary: 'Supervisor Team Dashboard',
      description: 'Team performance metrics, supervised agents breakdown, team collection totals',
      responses: { 200: { description: 'Supervisor team statistics' }, 403: { description: 'Supervisor role required' } }
    }
  },
  '/dashboard/agent': {
    get: {
      tags: ['Dashboards'],
      summary: 'Field Agent Personal Dashboard',
      description: 'Assigned customer count, visits queue, total collected vs target, recent receipts',
      responses: { 200: { description: 'Agent dashboard statistics' }, 403: { description: 'Field Agent role required' } }
    }
  },

  // ================= PERMISSIONS & RBAC =================
  '/permissions': {
    get: {
      tags: ['Roles & Permissions'],
      summary: 'List All System Permissions',
      description: 'Retrieves all 40 system permissions across modules. Also callable as /permissions/getAllPermissions.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'module', in: 'query', schema: { type: 'string' } },
        { name: 'search', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: { description: 'Permissions list' } }
    },
    post: {
      tags: ['Roles & Permissions'],
      summary: 'Create Custom Permission (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'code', 'module'],
              properties: {
                name: { type: 'string', example: 'Export Reports' },
                code: { type: 'string', example: 'reports:export' },
                module: { type: 'string', example: 'reports' },
                description: { type: 'string', example: 'Export detailed financial and agent performance reports' }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Permission created' } }
    }
  },
  '/permissions/getAdminPermissions': {
    get: {
      tags: ['Roles & Permissions'],
      summary: 'Get Admin Permissions (from admin_permissions table)',
      responses: { 200: { description: 'Admin permissions list' } }
    }
  },
  '/permissions/getSupervisorPermissions': {
    get: {
      tags: ['Roles & Permissions'],
      summary: 'Get Supervisor Permissions (from supervisor_permissions table)',
      responses: { 200: { description: 'Supervisor permissions list' } }
    }
  },
  '/permissions/getAgentPermissions': {
    get: {
      tags: ['Roles & Permissions'],
      summary: 'Get Agent Permissions (from agent_permissions table)',
      responses: { 200: { description: 'Agent permissions list' } }
    }
  },
  '/permissions/assignPermissionToRole': {
    post: {
      tags: ['Roles & Permissions'],
      summary: 'Assign Permission to Role (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role_id', 'permission_id'],
              properties: {
                role_id: { type: 'string', example: 'FIELD_AGENT', description: 'Target Role ID (e.g. ADMIN, SUPERVISOR, FIELD_AGENT)' },
                permission_id: { type: 'string', description: 'Permission UUID' }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Permission assigned to role' } }
    }
  },
  '/permissions/revokePermissionFromRole': {
    post: {
      tags: ['Roles & Permissions'],
      summary: 'Revoke Permission from Role (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role_id', 'permission_id'],
              properties: {
                role_id: { type: 'string', example: 'FIELD_AGENT', description: 'Target Role ID (e.g. ADMIN, SUPERVISOR, FIELD_AGENT)' },
                permission_id: { type: 'string', description: 'Permission UUID' }
              }
            }
          }
        }
      },
      responses: { 200: { description: 'Permission revoked from role' } }
    }
  },
  '/visits': {
    post: {
      tags: ['Field Visits'],
      summary: 'Record Field Visit (Admin, Supervisor, Field Agent)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'visit_outcome'],
              properties: {
                customer_id: { type: 'string', description: 'Customer UUID' },
                agent_id: { type: 'string', description: 'Agent UUID (auto-set for agents)' },
                assignment_id: { type: 'string', description: 'Optional Assignment UUID' },
                visit_date: { type: 'string', format: 'date-time' },
                visit_outcome: {
                  type: 'integer',
                  description: '0: Contacted, 1: Unavailable, 2: Address Not Found, 3: Requested More Time, 4: Payment Promise, 5: Dispute Raised, 6: Refused, 7: Follow-up Required'
                },
                remarks: { type: 'string', description: 'Visit notes' },
                next_follow_up_at: { type: 'string', format: 'date-time', description: 'Optional follow-up date' },
                latitude: { type: 'number', format: 'float' },
                longitude: { type: 'number', format: 'float' }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Field visit recorded successfully' } }
    },
    get: {
      tags: ['Field Visits'],
      summary: 'List Field Visits (Scoping applies)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'visit_outcome', in: 'query', schema: { type: 'integer' } },
        { name: 'customer_id', in: 'query', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: { 200: { description: 'Field visits retrieved successfully' } }
    }
  },
  '/visits/{id}': {
    get: {
      tags: ['Field Visits'],
      summary: 'Get Field Visit by ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Field visit details retrieved' } }
    }
  },
  '/follow-ups': {
    post: {
      tags: ['Follow-ups'],
      summary: 'Schedule Follow-up Action',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'scheduled_at', 'follow_up_type'],
              properties: {
                customer_id: { type: 'string', description: 'Customer UUID' },
                agent_id: { type: 'string', description: 'Agent UUID' },
                assignment_id: { type: 'string', description: 'Assignment UUID' },
                visit_id: { type: 'string', description: 'Optional related Visit UUID' },
                scheduled_at: { type: 'string', format: 'date-time' },
                follow_up_type: { type: 'integer', description: '0: Call, 1: Visit, 2: Document Request' },
                status: { type: 'integer', description: '0: Pending, 1: Completed, 2: Cancelled' },
                remarks: { type: 'string', description: 'Follow-up notes' }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Follow-up scheduled' } }
    },
    get: {
      tags: ['Follow-ups'],
      summary: 'List Follow-ups (Scoping applies)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'status', in: 'query', schema: { type: 'integer' } },
        { name: 'follow_up_type', in: 'query', schema: { type: 'integer' } },
        { name: 'customer_id', in: 'query', schema: { type: 'string' } }
      ],
      responses: { 200: { description: 'Follow-ups retrieved' } }
    }
  },
  '/follow-ups/{id}/complete': {
    patch: {
      tags: ['Follow-ups'],
      summary: 'Mark Follow-up as Completed',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                completed_at: { type: 'string', format: 'date-time' },
                remarks: { type: 'string', description: 'Completion notes' }
              }
            }
          }
        }
      },
      responses: { 200: { description: 'Follow-up marked as completed' } }
    }
  },

  // ================= AREAS =================
  '/areas': {
    post: {
      tags: ['Areas'],
      summary: 'Create Area (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['branch_id', 'area_code', 'name'],
              properties: {
                branch_id: { type: 'string', format: 'uuid', example: 'c7e2b10458cc4372a5670e02b2c3d479' },
                area_code: { type: 'string', example: 'BLR-NORTH-01' },
                name: { type: 'string', example: 'Hebbal & Yelahanka' },
                status: { type: 'integer', enum: [0, 1], default: 1, description: '0: Inactive, 1: Active' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Area created successfully' },
        409: { description: 'Area code conflict' }
      }
    },
    get: {
      tags: ['Areas'],
      summary: 'List Areas',
      parameters: [
        { name: 'branch_id', in: 'query', schema: { type: 'string' } },
        { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } }
      ],
      responses: { 200: { description: 'Areas list' } }
    }
  },
  '/areas/{id}': {
    get: {
      tags: ['Areas'],
      summary: 'Get Area Details',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Area details' }, 404: { description: 'Area not found' } }
    },
    patch: {
      tags: ['Areas'],
      summary: 'Update Area (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                branch_id: { type: 'string', format: 'uuid' },
                area_code: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
      responses: { 200: { description: 'Area updated successfully' } }
    }
  },
  '/areas/branch/{branchId}': {
    get: {
      tags: ['Areas'],
      summary: 'Get Areas for a Branch',
      parameters: [{ name: 'branchId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Branch areas list' } }
    }
  },

  // ================= PAYMENT MODES =================
  '/payment-modes': {
    post: {
      tags: ['Payment Modes'],
      summary: 'Create Payment Mode (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'name'],
              properties: {
                code: { type: 'string', example: 'NET_BANKING' },
                name: { type: 'string', example: 'Internet Banking' },
                status: { type: 'integer', enum: [0, 1], default: 1, description: '0: Inactive, 1: Active' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Payment mode created successfully' },
        409: { description: 'Payment mode code conflict' }
      }
    },
    get: {
      tags: ['Payment Modes'],
      summary: 'List Payment Modes',
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } }
      ],
      responses: { 200: { description: 'Payment modes list' } }
    }
  },
  '/payment-modes/{id}': {
    get: {
      tags: ['Payment Modes'],
      summary: 'Get Payment Mode Details',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Payment mode details' }, 404: { description: 'Payment mode not found' } }
    },
    patch: {
      tags: ['Payment Modes'],
      summary: 'Update Payment Mode (Admin only)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                name: { type: 'string' },
                status: { type: 'integer', enum: [0, 1] }
              }
            }
          }
        }
      },
      responses: { 200: { description: 'Payment mode updated successfully' } }
    }
  },

  // ================= MASTER VALUES =================
  '/masters': {
    get: {
      tags: ['Master Values'],
      summary: 'Get All Active Masters (Branches, Areas, Payment Modes, Organizations)',
      description: 'Returns all active configurable master data in a single payload for client dropdowns and configuration without hardcoding',
      responses: {
        200: { description: 'Active master datasets loaded successfully' }
      }
    }
  },
  '/masters/branches': {
    get: {
      tags: ['Master Values'],
      summary: 'Get Active Branches from Table',
      parameters: [{ name: 'organisation_id', in: 'query', schema: { type: 'string' } }],
      responses: { 200: { description: 'Active branches list' } }
    }
  },
  '/masters/areas': {
    get: {
      tags: ['Master Values'],
      summary: 'Get Active Areas from Table',
      parameters: [{ name: 'branch_id', in: 'query', schema: { type: 'string' } }],
      responses: { 200: { description: 'Active areas list' } }
    }
  },
  '/masters/payment-modes': {
    get: {
      tags: ['Master Values'],
      summary: 'Get Active Payment Modes from Table',
      responses: { 200: { description: 'Active payment modes list' } }
    }
  },

  // ================= ADMIN MODULE (ORGANIZATION CONTROL) =================
  '/admin/dashboard': {
    get: {
      tags: ['Admin Module'],
      summary: 'Organization Dashboard Summary',
      description: 'Consolidates total receivables, aging buckets, verified collections, reconciliation exceptions, performance, unassigned cases, disputes, security events, and master policy status.',
      responses: {
        200: { description: 'Organization dashboard summary retrieved' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' }
      }
    }
  },
  '/admin/users': {
    get: {
      tags: ['Admin Module'],
      summary: 'Admin User Search & Filter',
      description: 'Search and filter users across the organization with pagination and role scoping.',
      parameters: [
        { name: 'role_code', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'SUPERVISOR', 'FIELD_AGENT'] } },
        { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1, 2] } },
        { name: 'branch_id', in: 'query', schema: { type: 'string' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        200: { description: 'Admin users retrieved' },
        403: { $ref: '#/components/responses/ForbiddenError' }
      }
    },
    post: {
      tags: ['Admin Module'],
      summary: 'Create Authorized User',
      description: 'Create an authorized user with supervisor or agent profile within a managed transaction.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'mobile', 'password', 'role_code', 'employee_code'],
              properties: {
                name: { type: 'string', example: 'Kavita Rao' },
                email: { type: 'string', example: 'kavita.supervisor@collectagent.com' },
                mobile: { type: 'string', example: '9876543222' },
                password: { type: 'string', example: 'Password@123' },
                role_code: { type: 'string', enum: ['SUPERVISOR', 'FIELD_AGENT'], example: 'SUPERVISOR' },
                employee_code: { type: 'string', example: 'SUP-701' },
                branch_id: { type: 'string', format: 'uuid' },
                supervisor_id: { type: 'string', format: 'uuid' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Authorized user created' },
        409: { description: 'Email, mobile, or employee code conflict' },
        422: { $ref: '#/components/responses/ValidationError' }
      }
    }
  },
  '/admin/users/{id}/status': {
    patch: {
      tags: ['Admin Module'],
      summary: 'Update User Status (Activate/Deactivate/Suspend)',
      description: 'Update user status: 1 = Active, 0 = Inactive, 2 = Suspended. Session token is revoked upon status update.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'integer', enum: [0, 1, 2], description: '0=Inactive, 1=Active, 2=Suspended' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'User status updated' },
        404: { description: 'User not found' }
      }
    }
  },
  '/admin/branches': {
    get: {
      tags: ['Admin Module'],
      summary: 'Admin Branch Management',
      description: 'Retrieve branches with supervisor counts, agent counts, and operational status.',
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        200: { description: 'Admin branches retrieved' }
      }
    }
  },
  '/admin/areas': {
    get: {
      tags: ['Admin Module'],
      summary: 'Admin Area Management',
      description: 'Retrieve operational areas with associated customer portfolios and branch links.',
      parameters: [
        { name: 'branch_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        200: { description: 'Admin areas retrieved' }
      }
    }
  },
  '/admin/audit-logs': {
    get: {
      tags: ['Admin Module'],
      summary: 'Audit Event Search',
      description: 'Search security audit events, login attempts, IP addresses, user agents, and security failures.',
      parameters: [
        { name: 'user_id', in: 'query', schema: { type: 'string' } },
        { name: 'identifier', in: 'query', schema: { type: 'string' } },
        { name: 'success', in: 'query', schema: { type: 'integer', enum: [0, 1] } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
      ],
      responses: {
        200: { description: 'Audit events retrieved' }
      }
    }
  },
  '/admin/reconciliation': {
    get: {
      tags: ['Admin Module'],
      summary: 'Financial Reconciliation Exceptions',
      description: 'Consolidate financial exceptions, reversed payments, chargebacks, and discrepancies.',
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string', default: 'REVERSED' } },
        { name: 'branch_id', in: 'query', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
      ],
      responses: {
        200: { description: 'Financial reconciliation exceptions retrieved' }
      }
    }
  },
  '/admin/reports/aging': {
    get: {
      tags: ['Admin Module'],
      summary: 'Aging Report',
      description: 'Organization-wide aging analysis categorized by 0-30, 31-60, 61-90, 91-120, and 120+ days past due.',
      parameters: [
        { name: 'branch_id', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
      ],
      responses: {
        200: { description: 'Aging report retrieved' }
      }
    }
  },
  '/admin/reports/collections': {
    get: {
      tags: ['Admin Module'],
      summary: 'Collection Performance Report',
      description: 'Evaluate collection performance, targeted vs realized amounts, efficiency rate, and payment mode breakdown.',
      parameters: [
        { name: 'branch_id', in: 'query', schema: { type: 'string' } },
        { name: 'agent_id', in: 'query', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
      ],
      responses: {
        200: { description: 'Collection performance report retrieved' }
      }
    }
  }
};

module.exports = paths;

