const ApiResponse = require('../src/utils/apiResponse');

describe('Modular ApiResponse Message Resolution Tests', () => {
  it('loads and returns unique messages directly from module definition files', () => {
    // User module
    expect(ApiResponse.getMessage('users', 'created')).toBe('User created');
    expect(ApiResponse.getMessage('users', 'retrieved')).toBe('User retrieved');
    expect(ApiResponse.getMessage('users', 'list')).toBe('Users retrieved');
    expect(ApiResponse.getMessage('users', 'updated')).toBe('User updated');
    expect(ApiResponse.getMessage('users', 'statusUpdated')).toBe('User status updated');
    expect(ApiResponse.getMessage('users', 'deleted')).toBe('User deleted');

    // Customer module
    expect(ApiResponse.getMessage('customers', 'created')).toBe('Customer created');
    expect(ApiResponse.getMessage('customers', 'assigned')).toBe('Customer assigned to agent');

    // Branch module
    expect(ApiResponse.getMessage('branches', 'created')).toBe('Branch created');

    // Area module
    expect(ApiResponse.getMessage('areas', 'created')).toBe('Area created');

    // Payment Mode module
    expect(ApiResponse.getMessage('paymentModes', 'created')).toBe('Payment mode created');

    // Payment module
    expect(ApiResponse.getMessage('payments', 'created')).toBe('Payment recorded');
    expect(ApiResponse.getMessage('payments', 'confirmed')).toBe('Payment confirmed');
    expect(ApiResponse.getMessage('payments', 'reversed')).toBe('Payment reversed');

    // Field Visit module
    expect(ApiResponse.getMessage('visits', 'created')).toBe('Field visit recorded');

    // Follow-up module
    expect(ApiResponse.getMessage('followups', 'created')).toBe('Follow-up action scheduled');
    expect(ApiResponse.getMessage('followups', 'completed')).toBe('Follow-up marked as completed');

    // Auth module
    expect(ApiResponse.getMessage('auth', 'login')).toBe('Login successful');
  });

  it('dynamically infers and formats unique messages for new/unregistered modules', () => {
    expect(ApiResponse.getMessage('invoices', 'created')).toBe('Invoice created');
    expect(ApiResponse.getMessage('invoices', 'retrieved')).toBe('Invoice retrieved');
    expect(ApiResponse.getMessage('invoices', 'list')).toBe('Invoices retrieved');
    expect(ApiResponse.getMessage('invoices', 'updated')).toBe('Invoice updated');
    expect(ApiResponse.getMessage('invoices', 'deleted')).toBe('Invoice deleted');
  });

  it('automatically extracts module from Express response context (res.req.baseUrl)', () => {
    const mockRes = {
      req: { baseUrl: '/api/v1/users' },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };

    ApiResponse.created(mockRes, { id: 'u-1', name: 'Alice' });
    expect(mockRes.statusCode).toBe(201);
    expect(mockRes.body.success).toBe(true);
    expect(mockRes.body.message).toBe('User created');
    expect(mockRes.body.data.id).toBe('u-1');
  });

  it('automatically resolves module for paginated responses', () => {
    const mockRes = {
      req: { baseUrl: '/api/v1/customers' },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };

    ApiResponse.paginated(mockRes, [{ id: 'c-1' }], { page: 1, limit: 10, totalRecords: 1 });
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.body.success).toBe(true);
    expect(mockRes.body.message).toBe('Customers retrieved');
    expect(mockRes.body.data).toHaveLength(1);
    expect(mockRes.body.pagination.totalPages).toBe(1);
  });

  it('binds module via ApiResponse.forModule() helper', () => {
    const branchApi = ApiResponse.forModule('branches');
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };

    branchApi.created(mockRes, { id: 'b-1', name: 'Downtown Branch' });
    expect(mockRes.statusCode).toBe(201);
    expect(mockRes.body.success).toBe(true);
    expect(mockRes.body.message).toBe('Branch created');

    branchApi.updated(mockRes, { id: 'b-1', name: 'Updated Branch' });
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.body.message).toBe('Branch updated');

    branchApi.deleted(mockRes);
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.body.message).toBe('Branch deleted');
  });

  it('preserves custom explicit messages when explicitly passed by caller', () => {
    const mockRes = {
      req: { baseUrl: '/api/v1/users' },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };

    ApiResponse.created(mockRes, 'Custom user welcome message', { id: 'u-2' });
    expect(mockRes.statusCode).toBe(201);
    expect(mockRes.body.message).toBe('Custom user welcome message');
  });
});
