import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER FIXING

// PUT - Update HCS code hash for a tenant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, newHcsCode } = body;

    if (!email || !password || !newHcsCode) {
      return NextResponse.json({ 
        error: "email, password, and newHcsCode are required" 
      }, { status: 400 });
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { email },
    }) as any;

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify password first (security check)
    const passwordMatch = await bcrypt.compare(password, tenant.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Hash the new HCS code
    const newHcsCodeHash = await bcrypt.hash(newHcsCode, 10);

    // Update tenant
    await prisma.tenant.update({
      where: { email },
      data: { hcsCodeHash: newHcsCodeHash } as any,
    });

    return NextResponse.json({ 
      success: true, 
      message: "HCS code hash updated successfully",
      email: tenant.email,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Server error", 
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, hcsCode } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { email },
    }) as any;

    if (!tenant) {
      return NextResponse.json({ 
        error: "Tenant not found",
        email 
      }, { status: 404 });
    }

    const result: any = {
      tenantFound: true,
      tenantId: tenant.id,
      email: tenant.email,
      status: tenant.status,
      plan: tenant.plan,
      hasPasswordHash: !!tenant.passwordHash,
      hasHcsCodeHash: !!tenant.hcsCodeHash,
      passwordHashLength: tenant.passwordHash?.length || 0,
      hcsCodeHashLength: tenant.hcsCodeHash?.length || 0,
      passwordHashPrefix: tenant.passwordHash?.substring(0, 7) || "NULL",
      hcsCodeHashPrefix: tenant.hcsCodeHash?.substring(0, 7) || "NULL",
      passwordHashIsValidBcrypt: tenant.passwordHash?.startsWith("$2"),
      hcsCodeHashIsValidBcrypt: tenant.hcsCodeHash?.startsWith("$2"),
    };

    // Test password if provided
    if (password && tenant.passwordHash) {
      try {
        const passwordMatch = await bcrypt.compare(password, tenant.passwordHash);
        result.passwordTest = {
          provided: true,
          matches: passwordMatch,
          inputLength: password.length,
        };
      } catch (e: any) {
        result.passwordTest = {
          provided: true,
          error: e.message,
        };
      }
    }

    // Test HCS code if provided
    if (hcsCode && tenant.hcsCodeHash) {
      try {
        const hcsCodeMatch = await bcrypt.compare(hcsCode, tenant.hcsCodeHash);
        result.hcsCodeTest = {
          provided: true,
          matches: hcsCodeMatch,
          inputLength: hcsCode.length,
          inputPrefix: hcsCode.substring(0, 20),
        };
      } catch (e: any) {
        result.hcsCodeTest = {
          provided: true,
          error: e.message,
        };
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Server error", 
      message: error.message 
    }, { status: 500 });
  }
}
