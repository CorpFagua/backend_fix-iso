import type { Prisma } from '@prisma/client';
import prisma from '../../config/database';

type CompanyRow = Prisma.CompanyGetPayload<{
  include: { sector: { select: { name: true } }; size: { select: { name: true } } };
}>;

type CompanyUserRow = Prisma.CompanyUserGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;

export async function getAllCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      sector: { select: { name: true } },
      size: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return companies.map((c: CompanyRow) => ({
    id: c.id,
    name: c.name,
    sectorId: c.sectorId,
    sectorName: c.sector.name,
    sizeId: c.sizeId,
    sizeName: c.size.name,
    country: c.country,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
  }));
}

export async function getCompanyById(id: number) {
  const c = await prisma.company.findUnique({
    where: { id },
    include: {
      sector: { select: { name: true } },
      size: { select: { name: true } },
    },
  });
  if (!c) return null;

  return {
    id: c.id,
    name: c.name,
    sectorId: c.sectorId,
    sectorName: c.sector.name,
    sizeId: c.sizeId,
    sizeName: c.size.name,
    country: c.country,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
  };
}

export async function createCompany(data: { name: string; sectorId: number; sizeId: number; country: string }, userId: number) {
  const c = await prisma.company.create({
    data: { ...data, createdBy: userId },
    include: {
      sector: { select: { name: true } },
      size: { select: { name: true } },
    },
  });

  return {
    id: c.id,
    name: c.name,
    sectorId: c.sectorId,
    sectorName: c.sector.name,
    sizeId: c.sizeId,
    sizeName: c.size.name,
    country: c.country,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
  };
}

export async function updateCompany(id: number, data: { name?: string; sectorId?: number; sizeId?: number; country?: string }) {
  const c = await prisma.company.update({
    where: { id },
    data,
    include: {
      sector: { select: { name: true } },
      size: { select: { name: true } },
    },
  });

  return {
    id: c.id,
    name: c.name,
    sectorId: c.sectorId,
    sectorName: c.sector.name,
    sizeId: c.sizeId,
    sizeName: c.size.name,
    country: c.country,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
  };
}

export async function deleteCompany(id: number) {
  await prisma.company.delete({ where: { id } });
}

// ── Company Users ──

export async function getCompanyUsers(companyId: number) {
  const users = await prisma.companyUser.findMany({
    where: { companyId },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  return users.map((cu: CompanyUserRow) => ({
    companyId: cu.companyId,
    userId: cu.userId,
    userName: cu.user.name,
    userEmail: cu.user.email,
    roleInCompany: cu.roleInCompany,
    assignedAt: cu.assignedAt,
  }));
}

export async function addCompanyUser(companyId: number, userId: number, roleInCompany?: string) {
  const cu = await prisma.companyUser.create({
    data: { companyId, userId, roleInCompany },
    include: { user: { select: { name: true, email: true } } },
  });

  return {
    companyId: cu.companyId,
    userId: cu.userId,
    userName: cu.user.name,
    userEmail: cu.user.email,
    roleInCompany: cu.roleInCompany,
    assignedAt: cu.assignedAt,
  };
}

export async function removeCompanyUser(companyId: number, userId: number) {
  await prisma.companyUser.delete({
    where: { companyId_userId: { companyId, userId } },
  });
}
