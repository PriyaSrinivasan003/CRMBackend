const { sequelize } = require('../config/database');

// Import model classes
const Organization = require('./Organization');
const Role = require('./Role');
const Branch = require('./Branch');
const User = require('./User');
const Supervisor = require('./Supervisor');
const Agent = require('./Agent');
const Customer = require('./Customer');
const AgentSupervisorAssignment = require('./AgentSupervisorAssignment');
const CustomerAgentAssignment = require('./CustomerAgentAssignment');
const Collection = require('./Collection');
const Payment = require('./Payment');
const RefreshToken = require('./RefreshToken');
const LoginAudit = require('./LoginAudit');
const PasswordResetOtp = require('./PasswordResetOtp');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const AdminPermission = require('./AdminPermission');
const SupervisorPermission = require('./SupervisorPermission');
const AgentPermission = require('./AgentPermission');
const FieldVisit = require('./FieldVisit');
const FollowUp = require('./FollowUp');
const PaymentAllocation = require('./PaymentAllocation');
const Area = require('./Area');
const PaymentMode = require('./PaymentMode');
const PromiseToPay = require('./PromiseToPay');
const FollowUpTask = require('./FollowUpTask');

const models = {
  Organization: Organization.initModel(sequelize),
  Role: Role.initModel(sequelize),
  Branch: Branch.initModel(sequelize),
  User: User.initModel(sequelize),
  Supervisor: Supervisor.initModel(sequelize),
  Agent: Agent.initModel(sequelize),
  Customer: Customer.initModel(sequelize),
  AgentSupervisorAssignment: AgentSupervisorAssignment.initModel(sequelize),
  CustomerAgentAssignment: CustomerAgentAssignment.initModel(sequelize),
  Collection: Collection.initModel(sequelize),
  Payment: Payment.initModel(sequelize),
  RefreshToken: RefreshToken.initModel(sequelize),
  LoginAudit: LoginAudit.initModel(sequelize),
  PasswordResetOtp: PasswordResetOtp.initModel(sequelize),
  Permission: Permission.initModel(sequelize),
  RolePermission: RolePermission.initModel(sequelize),
  AdminPermission: AdminPermission.initModel(sequelize),
  SupervisorPermission: SupervisorPermission.initModel(sequelize),
  AgentPermission: AgentPermission.initModel(sequelize),
  FieldVisit: FieldVisit.initModel(sequelize),
  FollowUp: FollowUp.initModel(sequelize),
  PaymentAllocation: PaymentAllocation.initModel(sequelize),
  Area: Area.initModel(sequelize),
  PaymentMode: PaymentMode.initModel(sequelize),
  PromiseToPay: PromiseToPay.initModel(sequelize),
  FollowUpTask: FollowUpTask.initModel(sequelize)
};

// Set up associations
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Global hooks to enforce that id is a unique UUID without hyphens across all models & tables
const { generateUuid } = require('../utils/uuid');

const sanitizeInstanceIds = (instance) => {
  if (!instance) return;
  if (!instance.id) {
    instance.id = generateUuid();
  } else if (typeof instance.id === 'string' && instance.id.includes('-')) {
    instance.id = instance.id.replace(/-/g, '');
  }

  if (instance.dataValues) {
    for (const key of Object.keys(instance.dataValues)) {
      if (key.endsWith('_id') && typeof instance.dataValues[key] === 'string' && instance.dataValues[key].includes('-')) {
        instance.dataValues[key] = instance.dataValues[key].replace(/-/g, '');
      }
    }
  }
};

sequelize.addHook('beforeValidate', sanitizeInstanceIds);
sequelize.addHook('beforeCreate', sanitizeInstanceIds);

module.exports = {
  sequelize,
  ...models
};
