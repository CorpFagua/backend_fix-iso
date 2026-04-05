/**
 * Control Applicability Rules for ISO 27001:2022
 *
 * Defines which controls apply to which combinations of sector + company size.
 * Based on ISO 27001:2022 Annex A best practices and industry-specific requirements.
 *
 * Structure: [controlId, sectorId, sizeId, priority, mandatory]
 *
 * Priority: 1=High (critical), 2=Medium, 3=Low (optional)
 * Mandatory: true=required, false=recommended
 *
 * Sectors (1-7):
 * 1=Tecnología, 2=Financiero, 3=Salud, 4=Gobierno, 5=Educación, 6=Manufactura, 7=Retail
 *
 * Company Sizes (1-4):
 * 1=Micro, 2=Pequeña, 3=Mediana, 4=Grande
 */

export interface ControlApplicabilityRule {
  controlId: number;
  sectorId: number;
  sizeId: number;
  priority: number;
  mandatory: boolean;
}

/**
 * Generate complete control applicability matrix
 */
export function generateControlApplicabilityRules(): ControlApplicabilityRule[] {
  const rules: ControlApplicabilityRule[] = [];

  // Helper: Add rules for a control across multiple sector-size combinations
  const addRule = (
    controlId: number,
    sectors: number[],
    sizes: number[],
    priority: number,
    mandatory: boolean
  ) => {
    for (const sectorId of sectors) {
      for (const sizeId of sizes) {
        rules.push({ controlId, sectorId, sizeId, priority, mandatory });
      }
    }
  };

  // ──────────────────────────────────────────────
  // ORGANIZATIONAL CONTROLS (A.5.1 - A.5.37, controlIds 1-37)
  // ──────────────────────────────────────────────

  // = UNIVERSAL CONTROLS (ALL sectors, ALL sizes, HIGH priority, MANDATORY)
  // A.5.1 — Policies for information security
  addRule(1, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.2 — Information security roles and responsibilities
  addRule(2, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.3 — Segregation of duties
  addRule(3, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(3, [1, 2, 3, 4, 5, 6, 7], [1], 2, false); // Micro: recommended only

  // A.5.4 — Management responsibilities
  addRule(4, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.7 — Threat intelligence
  addRule(7, [1, 2, 3, 4, 5, 6, 7], [3, 4], 2, true);
  addRule(7, [1, 2, 3, 4, 5, 6, 7], [1, 2], 3, false);

  // A.5.10 — Acceptable use of information and assets
  addRule(10, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.24 — Management of information security incidents
  addRule(24, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.25 — Business continuity and disaster recovery (HIGH for all)
  addRule(25, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(25, [2, 4], [1], 2, true); // Micro mandatory for Finance/Government
  addRule(25, [1, 3, 5, 6, 7], [1], 2, false); // Micro recommended for others

  // A.5.26 — Monitoring and review of information security
  addRule(26, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(26, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.5.27 — Removal of access rights
  addRule(27, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.28 — Information security readiness
  addRule(28, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(28, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // ─ SECTOR-SPECIFIC ORGANIZATIONAL CONTROLS

  // A.5.5 — Access to information and other related assets (HR + Compliance)
  addRule(5, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.6 — Contact with authorities and interest groups
  addRule(6, [2, 3, 4], [1, 2, 3, 4], 1, true); // Finance/Health/Government: HIGH
  addRule(6, [1, 5, 6, 7], [2, 3, 4], 2, true); // Others: MEDIUM for large

  // A.5.8 — Management of ICT supplier relationships
  addRule(8, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(8, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.5.9 — Coordination of information security incident management
  addRule(9, [2, 4], [1, 2, 3, 4], 1, true); // Finance/Government: mandatory
  addRule(9, [1, 3, 5, 6, 7], [2, 3, 4], 1, true); // Others: mandatory for large
  addRule(9, [1, 3, 5, 6, 7], [1], 2, false); // Others: optional for small

  // A.5.11 — Return of assets
  addRule(11, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 2, true);

  // A.5.12 — Classification of information
  addRule(12, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(12, [2, 3, 4], [1], 1, true); // Mandatory for Finance/Health/Government even Micro
  addRule(12, [1, 5, 6, 7], [1], 2, false); // Recommended for others' Micro

  // A.5.13 — Labeling of information
  addRule(13, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(13, [2, 3, 4], [1], 2, true); // Recommended for Finance/Health/Government
  addRule(13, [1, 5, 6, 7], [1], 3, false); // Optional for others

  // A.5.14 — Transfer of information
  addRule(14, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(14, [2, 3, 4], [1], 1, true); // Finance/Health/Government: mandatory
  addRule(14, [1, 5, 6, 7], [1], 2, false); // Others: recommended

  // A.5.15 — Access control (Restrict access to information)
  addRule(15, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.16 — Identity management
  addRule(16, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.17 — Authentication information (secure password management)
  addRule(17, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.18 — Access rights (Least privilege)
  addRule(18, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.5.19 — Supplier relationships security
  addRule(19, [2, 4], [1, 2, 3, 4], 1, true); // Finance/Government: HIGH mandatory
  addRule(19, [1, 3, 5, 6, 7], [2, 3, 4], 1, true); // Others: mandatory for large
  addRule(19, [3], [1], 1, true); // Health: mandatory all sizes
  addRule(19, [1, 5, 6, 7], [1], 2, false); // Others: recommended for small

  // A.5.20 — Addressing information security in supplier relationships
  addRule(20, [2, 4], [1, 2, 3, 4], 1, true);
  addRule(20, [1, 3, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(20, [3], [1], 1, true);
  addRule(20, [1, 5, 6, 7], [1], 2, false);

  // A.5.21 — Management of information security in supplier relationships
  addRule(21, [2, 4], [1, 2, 3, 4], 1, true);
  addRule(21, [1, 3, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(21, [3], [1], 1, true);
  addRule(21, [1, 5, 6, 7], [1], 2, false);

  // A.5.22 — Monitoring, review and change management of supplier services
  addRule(22, [2, 4], [1, 2, 3, 4], 1, true);
  addRule(22, [1, 3, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(22, [3], [1], 1, true);
  addRule(22, [1, 5, 6, 7], [1], 2, false);

  // A.5.23 — Information security for use of supplier ICT services
  addRule(23, [2, 4], [1, 2, 3, 4], 1, true);
  addRule(23, [1, 3, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(23, [3], [1], 1, true);
  addRule(23, [1, 5, 6, 7], [1], 2, false);

  // A.5.29 — Information security within newly acquired or merged organizations
  addRule(29, [2], [2, 3, 4], 1, true); // Finance: HIGH
  addRule(29, [1], [3, 4], 1, true); // Tech: HIGH for large
  addRule(29, [1, 2, 4, 5, 6, 7], [2, 3, 4], 2, true); // Others: MEDIUM
  addRule(29, [1, 3, 4, 5, 6, 7], [1], 3, false);

  // A.5.30 — Information security within IT project and change management
  addRule(30, [1, 2, 4], [2, 3, 4], 1, true);
  addRule(30, [3, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(30, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.5.31 — Identification of information security risks related to changes
  addRule(31, [1, 2, 4], [2, 3, 4], 1, true);
  addRule(31, [3, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(31, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.5.32 — Responsibilities and procedures for managing information security events
  addRule(32, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(32, [2, 3, 4], [1], 1, true); // Finance/Health/Government: mandatory
  addRule(32, [1, 5, 6, 7], [1], 2, false);

  // A.5.33 — Rights and obligations of employees and contractors
  addRule(33, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 2, true);
  addRule(33, [2, 3, 4], [1], 1, true); // Mandatory for regulated sectors
  addRule(33, [1, 5, 6, 7], [1], 2, false);

  // A.5.34 — Information security responsibilities of employees
  addRule(34, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(34, [2, 3, 4], [1], 1, true);
  addRule(34, [1, 5, 6, 7], [1], 2, true);

  // A.5.35 — Information security in recruitment
  addRule(35, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 2, true);
  addRule(35, [2, 3, 4], [1], 1, true);
  addRule(35, [1, 5, 6, 7], [1], 2, false);

  // A.5.36 — Management of information security incident response capabilities
  addRule(36, [2, 3, 4], [1, 2, 3, 4], 1, true); // Finance/Health/Government: HIGH
  addRule(36, [1], [2, 3, 4], 1, true); // Tech: HIGH for large
  addRule(36, [5, 6, 7], [2, 3, 4], 2, true); // Others: MEDIUM for large
  addRule(36, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.5.37 — Cooperation with external organizations on information security matters
  addRule(37, [2, 4], [2, 3, 4], 1, true);
  addRule(37, [1, 3, 5, 6, 7], [2, 3, 4], 2, true);
  addRule(37, [1, 2, 3, 4, 5, 6, 7], [1], 3, false);

  // ──────────────────────────────────────────────
  // PEOPLE CONTROLS (A.6.1 - A.6.8, controlIds 38-45)
  // ──────────────────────────────────────────────

  // A.6.1 — Screening (Background checks)
  addRule(38, [2, 3, 4], [1, 2, 3, 4], 1, true); // Finance/Health/Government: mandatory
  addRule(38, [1, 5, 6, 7], [2, 3, 4], 1, true); // Others: mandatory for large
  addRule(38, [1, 5, 6, 7], [1], 2, false); // Others: recommended for small

  // A.6.2 — Terms and conditions of employment (Contracts with security obligations)
  addRule(39, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(39, [2, 3, 4], [1], 1, true); // Mandatory regulated sectors
  addRule(39, [1, 5, 6, 7], [1], 2, true); // Recommended others

  // A.6.3 — Information security awareness, education and training
  addRule(40, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.6.4 — Disciplinary process (Handling information security violations)
  addRule(41, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 2, true);
  addRule(41, [2, 3, 4], [1], 2, true); // Recommended regulated sectors
  addRule(41, [1, 5, 6, 7], [1], 3, false); // Optional for small

  // A.6.5 — Responsibilities after termination or change of employment
  addRule(42, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(42, [2, 3, 4], [1], 1, true);
  addRule(42, [1, 5, 6, 7], [1], 2, false);

  // A.6.6 — Confidentiality or non-disclosure agreements
  addRule(43, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(43, [2, 3, 4], [1], 1, true);
  addRule(43, [1, 5, 6, 7], [1], 2, true);

  // A.6.7 — Remote working (Information security of remote work)
  addRule(44, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(44, [1, 2, 3, 4, 5, 6, 7], [1], 2, true); // Increasingly relevant post-COVID

  // A.6.8 — Information security event reporting
  addRule(45, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(45, [2, 3, 4], [1], 1, true);
  addRule(45, [1, 5, 6, 7], [1], 2, true);

  // ──────────────────────────────────────────────
  // PHYSICAL CONTROLS (A.7.1 - A.7.14, controlIds 46-59)
  // ──────────────────────────────────────────────

  // A.7.1 — Physical security perimeters (Buildings/areas with physical security controls)
  addRule(46, [1, 2, 3, 4, 5, 6, 7], [3, 4], 1, true); // Mandatory for medium/large
  addRule(46, [1], [2], 1, true); // Tech small: HIGH due to server rooms
  addRule(46, [2, 3, 4, 5, 6, 7], [2], 2, true); // Others: MEDIUM for small
  addRule(46, [1, 2, 3, 4, 5, 6, 7], [1], 3, false); // Micro: optional

  // A.7.2 — Physical entry (Secure building access)
  addRule(47, [2, 3, 4, 6], [2, 3, 4], 1, true); // Finance/Health/Gov/Manuf: HIGH
  addRule(47, [1, 5, 7], [3, 4], 1, true); // Tech/Educ/Retail: HIGH for large
  addRule(47, [1, 2, 3, 4, 5, 6, 7], [2], 2, true); // All: MEDIUM for small
  addRule(47, [1, 2, 3, 4, 5, 6, 7], [1], 3, false); // All: optional for micro

  // A.7.3 — Securing offices, rooms and facilities (Protect from unauthorized access)
  addRule(48, [1, 2, 3, 4, 5, 6, 7], [3, 4], 1, true); // Mandatory medium/large
  addRule(48, [1], [2], 2, true); // Tech small: recommended
  addRule(48, [2, 3, 4, 6], [2], 2, true); // Others mandatory: recommended
  addRule(48, [1, 2, 3, 4, 5, 6, 7], [1], 3, false); // Micro: optional

  // A.7.4 — Physical security monitoring (CCTV, access logs)
  addRule(49, [2, 3, 4, 6], [3, 4], 1, true); // Finance/Health/Gov/Manuf: HIGH
  addRule(49, [1], [4], 1, true); // Tech: HIGH for enterprise
  addRule(49, [1, 2, 3, 4, 5, 6, 7], [3], 2, true); // All: MEDIUM for large
  addRule(49, [1, 2, 3, 4, 5, 6, 7], [1, 2], 3, false); // All: optional for small

  // A.7.5 — Access to and use of utilities (Electricity, water, comms)
  addRule(50, [1, 2, 3, 4, 5, 6, 7], [3, 4], 2, true); // All: MEDIUM/HIGH for large
  addRule(50, [1], [2, 3], 2, true); // Tech: higher priority
  addRule(50, [2, 3, 4, 6], [2], 2, true); // Regulated: MEDIUM
  addRule(50, [5, 7], [2], 2, false); // Educ/Retail: optional
  addRule(50, [1, 2, 3, 4, 5, 6, 7], [1], 3, false);

  // A.7.6 — Physical security – delivery and loading areas
  addRule(51, [6], [2, 3, 4], 1, true); // Manufacturing: HIGH
  addRule(51, [7], [3, 4], 2, true); // Retail: medium for large
  addRule(51, [1, 2, 3, 4, 5], [3, 4], 2, false); // Others: optional for large
  addRule(51, [1, 2, 3, 4, 5, 6, 7], [1, 2], 3, false);

  // A.7.7 — Protecting Against Physical and Environmental Hazards
  addRule(52, [1, 2, 3, 4, 5, 6, 7], [3, 4], 2, true);
  addRule(52, [1], [2], 2, true); // Tech: important for datacenters
  addRule(52, [3, 6], [2], 2, true); // Health/Manuf: important
  addRule(52, [2, 4, 5, 7], [2], 2, false);
  addRule(52, [1, 2, 3, 4, 5, 6, 7], [1], 3, false);

  // A.7.8 — Working in secure areas (Unattended users, working space security)
  addRule(53, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 2, true);
  addRule(53, [2, 3, 4], [1], 2, true); // Regulated sectors: mandatory
  addRule(53, [1, 5, 6, 7], [1], 3, false);

  // A.7.9 — Overhead Cable Routes (Physical protection of cables)
  addRule(54, [1, 4, 6], [3, 4], 2, true); // Tech/Gov/Manuf: servers critical
  addRule(54, [1, 2, 3, 4, 5, 6, 7], [3], 2, false); // All: recommended for medium
  addRule(54, [1, 2, 3, 4, 5, 6, 7], [1, 2], 3, false);

  // A.7.10 — Cabling Security
  addRule(55, [1, 4, 6], [3, 4], 2, true);
  addRule(55, [1, 2, 3, 4, 5, 6, 7], [3], 2, false);
  addRule(55, [1, 2, 3, 4, 5, 6, 7], [1, 2], 3, false);

  // A.7.11 — Equipment Siting and Protection
  addRule(56, [1, 2, 3, 4, 6], [2, 3, 4], 1, true);
  addRule(56, [5, 7], [3, 4], 1, true);
  addRule(56, [1], [2], 2, true);
  addRule(56, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.7.12 — Power Supply (Uninterruptible power supply, backup generators)
  addRule(57, [1, 2, 3, 4, 5, 6], [3, 4], 1, true);
  addRule(57, [7], [3, 4], 2, false);
  addRule(57, [1, 2, 4, 6], [2], 2, true);
  addRule(57, [3, 5, 7], [2], 2, false);
  addRule(57, [1, 2, 3, 4, 5, 6, 7], [1], 3, false);

  // A.7.13 — Communication wiring (Separate datacom cables from power)
  addRule(58, [1, 2, 3, 4, 6], [3, 4], 2, true);
  addRule(58, [1], [2], 2, true);
  addRule(58, [1, 2, 3, 4, 5, 6, 7], [3], 2, false);
  addRule(58, [1, 2, 3, 4, 5, 6, 7], [1, 2], 3, false);

  // A.7.14 — Equipment Maintenance (Maintain records of equipment maintenance)
  addRule(59, [1, 2, 3, 4, 5, 6], [2, 3, 4], 2, true);
  addRule(59, [7], [3, 4], 2, false);
  addRule(59, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // ──────────────────────────────────────────────
  // TECHNOLOGICAL CONTROLS (A.8.1 - A.8.34, controlIds 60-93)
  // ──────────────────────────────────────────────

  // = HIGH PRIORITY CONTROLS (apply broadly)

  // A.8.1 — User endpoint devices (Secure computers/devices)
  addRule(60, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.8.2 — Privileged access rights (Restrict admin access)
  addRule(61, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.8.3 — Information access restriction (Data classification enforcement)
  addRule(62, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(62, [2, 3, 4], [1], 1, true); // Mandatory regulated
  addRule(62, [1, 5, 6, 7], [1], 2, true); // Recommended others

  // A.8.4 — Access to program source code
  addRule(63, [1], [2, 3, 4], 1, true); // Tech: HIGH
  addRule(63, [1, 2, 3, 4, 5, 6], [3, 4], 1, true); // Others: HIGH for large
  addRule(63, [1, 2, 3, 4, 5, 6, 7], [1, 2], 2, false);

  // A.8.5 — Secure authentication (MFA, strong passwords)
  addRule(64, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.8.6 — Capacity management (Prevent DoS due to resource exhaustion)
  addRule(65, [1], [2, 3, 4], 1, true); // Tech: HIGH
  addRule(65, [2, 4], [2, 3, 4], 1, true); // Finance/Gov: HIGH
  addRule(65, [1, 2, 3, 4, 5, 6, 7], [3], 1, true); // All: mandatory for large
  addRule(65, [1, 2, 3, 4, 5, 6, 7], [1, 2], 2, true);

  // A.8.7 — Protection against malware (Antivirus, EDR)
  addRule(66, [1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4], 1, true);

  // A.8.8 — Management of removable media (USB controls, DLP)
  addRule(67, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(67, [2, 3, 4], [1], 1, true); // Mandatory regulated
  addRule(67, [1, 5, 6, 7], [1], 2, true);

  // A.8.9 — Disposal of information (Secure data destruction)
  addRule(68, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(68, [2, 3, 4], [1], 1, true);
  addRule(68, [1, 5, 6, 7], [1], 2, true);

  // A.8.10 — Data Obfuscation (Encryption/masking of sensitive data)
  addRule(69, [2, 3, 4], [1, 2, 3, 4], 1, true); // Finance/Health/Gov: mandatory
  addRule(69, [1], [2, 3, 4], 1, true); // Tech: mandatory for large
  addRule(69, [5, 6, 7], [3, 4], 1, true); // Others: mandatory for large
  addRule(69, [1, 2, 3, 4, 5, 6, 7], [1, 2], 2, true);

  // A.8.11 — Data Leakage Prevention (DLP tools)
  addRule(70, [2, 4], [2, 3, 4], 1, true); // Finance/Gov: HIGH
  addRule(70, [1, 3], [3, 4], 1, true); // Tech/Health: HIGH for large
  addRule(70, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(70, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.12 — Logging (Activity logging and monitoring)
  addRule(71, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(71, [2, 3, 4], [1], 1, true); // Mandatory regulated
  addRule(71, [1, 5, 6, 7], [1], 2, true);

  // A.8.13 — Monitoring activities (SIEM, threat detection)
  addRule(72, [2, 3, 4], [2, 3, 4], 1, true); // Finance/Health/Gov: HIGH
  addRule(72, [1], [3, 4], 1, true); // Tech: HIGH for large
  addRule(72, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(72, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.14 — Clock Synchronization (NTP, time accuracy)
  addRule(73, [1, 2, 3, 4], [3, 4], 1, true);
  addRule(73, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(73, [1, 2, 3, 4, 5, 6, 7], [1], 3, false);

  // A.8.15 — Secure development life cycle (SSDLC)
  addRule(74, [1], [3, 4], 1, true); // Tech: HIGH
  addRule(74, [1], [2], 2, true); // Tech: MEDIUM for small
  addRule(74, [2, 4, 6], [3, 4], 2, true); // Finance/Gov/Manuf: MEDIUM for large
  addRule(74, [1, 2, 3, 4, 5, 6, 7], [1], 3, false);

  // A.8.16 — Vulnerability and patch management
  addRule(75, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(75, [2, 3, 4], [1], 1, true); // Mandatory regulated
  addRule(75, [1, 5, 6, 7], [1], 2, true);

  // A.8.17 — Information systems security testing (Penetration testing)
  addRule(76, [2, 3, 4], [2, 3, 4], 1, true); // Finance/Health/Gov: mandatory
  addRule(76, [1], [3, 4], 1, true); // Tech: mandatory for large
  addRule(76, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(76, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.18 — Management of test data (Production data sanitization)
  addRule(77, [1, 2, 3, 4], [2, 3, 4], 1, true);
  addRule(77, [1, 2, 3, 4], [1], 2, true);
  addRule(77, [5, 6, 7], [3, 4], 2, true);
  addRule(77, [5, 6, 7], [1, 2], 3, false);

  // A.8.19 — Installation of software on operational systems (Software approval)
  addRule(78, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(78, [2, 3, 4], [1], 2, true); // Recommended regulated
  addRule(78, [1, 5, 6, 7], [1], 2, true);

  // A.8.20 — Information security requirements for networks (Network security)
  addRule(79, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(79, [2, 3, 4], [1], 1, true);
  addRule(79, [1, 5, 6, 7], [1], 2, true);

  // A.8.21 — Segregation of networks (VLANs, DMZ, zero trust)
  addRule(80, [2, 3, 4], [2, 3, 4], 1, true); // Finance/Health/Gov: HIGH
  addRule(80, [1], [3, 4], 1, true); // Tech: HIGH for large
  addRule(80, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(80, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.22 — Packet Filtering (Firewall, IPS/IDS)
  addRule(81, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(81, [2, 3, 4], [1], 1, true);
  addRule(81, [1, 5, 6, 7], [1], 2, true);

  // A.8.23 — Use of Cryptography (Encrypt data in transit/rest)
  addRule(82, [2, 3, 4], [1, 2, 3, 4], 1, true); // Finance/Health/Gov: mandatory
  addRule(82, [1], [2, 3, 4], 1, true); // Tech: HIGH
  addRule(82, [5, 6, 7], [3, 4], 1, true); // Others: mandatory for large
  addRule(82, [1, 2, 3, 4, 5, 6, 7], [1, 2], 2, true);

  // A.8.24 — Key Management (Protect, store, rotate crypto keys)
  addRule(83, [2, 3, 4], [2, 3, 4], 1, true); // Finance/Health/Gov: HIGH
  addRule(83, [1], [3, 4], 1, true); // Tech: HIGH for large
  addRule(83, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(83, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.25 — Secure development - coding practices
  addRule(84, [1], [2, 3, 4], 1, true); // Tech: HIGH
  addRule(84, [1], [1], 2, false); // Tech: optional micro
  addRule(84, [2, 3, 4, 5, 6, 7], [3, 4], 2, false);
  addRule(84, [1, 2, 3, 4, 5, 6, 7], [1, 2], 3, false);

  // A.8.26 — Application security requirements
  addRule(85, [1], [2, 3, 4], 1, true); // Tech: HIGH
  addRule(85, [1], [1], 2, false);
  addRule(85, [2, 3, 4, 5, 6], [3, 4], 2, true);
  addRule(85, [1, 2, 3, 4, 5, 6, 7], [1, 2], 2, false);

  // A.8.27 — Secure system architecture and engineering (Edge cases, redundancy)
  addRule(86, [1, 2, 3, 4, 5, 6], [3, 4], 1, true);
  addRule(86, [1], [2], 2, true);
  addRule(86, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.28 — Secure supply chain of information and communication technology
  addRule(87, [2, 4], [2, 3, 4], 1, true); // Finance/Gov: HIGH
  addRule(87, [1, 3, 5, 6], [3, 4], 1, true); // Others: mandatory for large
  addRule(87, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(87, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.29 — Information systems security of cloud services
  addRule(88, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(88, [2, 3, 4], [1], 1, true); // Mandatory regulated
  addRule(88, [1, 5, 6, 7], [1], 2, true);

  // A.8.30 — ICT readiness for business continuity
  addRule(89, [2, 3, 4], [2, 3, 4], 1, true); // Finance/Health/Gov: HIGH
  addRule(89, [1], [3, 4], 1, true); // Tech: HIGH for large
  addRule(89, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(89, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.31 — Acceptable use of information and information processing facilities
  addRule(90, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 2, true);
  addRule(90, [2, 3, 4], [1], 2, true);
  addRule(90, [1, 5, 6, 7], [1], 2, false);

  // A.8.32 — Information security incident management procedures
  addRule(91, [1, 2, 3, 4, 5, 6, 7], [2, 3, 4], 1, true);
  addRule(91, [2, 3, 4], [1], 1, true);
  addRule(91, [1, 5, 6, 7], [1], 2, true);

  // A.8.33 — Improvement of information security incident management
  addRule(92, [2, 3, 4], [2, 3, 4], 1, true); // Finance/Health/Gov: HIGH
  addRule(92, [1], [3, 4], 1, true); // Tech: HIGH for large
  addRule(92, [1, 2, 3, 4, 5, 6, 7], [2], 2, true);
  addRule(92, [1, 2, 3, 4, 5, 6, 7], [1], 2, false);

  // A.8.34 — ICT supplier relationship security documentation
  addRule(93, [2, 4], [1, 2, 3, 4], 1, true); // Finance/Gov: mandatory all sizes
  addRule(93, [1, 3, 5, 6], [2, 3, 4], 1, true); // Others: mandatory for large
  addRule(93, [1, 3, 5, 6, 7], [1], 2, true);

  return rules;
}
