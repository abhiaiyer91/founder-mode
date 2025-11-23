import { PrismaClient } from '@prisma/client'

export async function seed() {
  const prisma = new PrismaClient()
  try {
    await prisma.deployment.deleteMany()
    await prisma.build.deleteMany()
    await prisma.project.deleteMany()

    const consoleProject = await prisma.project.create({
      data: {
        name: 'HelixStack Console',
        repoUrl: 'https://github.com/helixstack/console',
        defaultBranch: 'main',
        buildCommand: 'pnpm build',
        startCommand: 'pnpm dev',
        provider: 'fly-io',
        lastDeployAt: new Date(),
        previewDomain: 'preview.console.helix.run',
        productionDomain: 'console.helix.run',
      },
    })

    const aiDocsProject = await prisma.project.create({
      data: {
        name: 'AI Docs Service',
        repoUrl: 'https://github.com/acme/ai-docs',
        defaultBranch: 'main',
        buildCommand: 'npm run build',
        startCommand: 'npm start',
        provider: 'aws-lambda',
        lastDeployAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        previewDomain: 'preview.ai-docs.helix.run',
        productionDomain: 'ai-docs.example.com',
      },
    })

    const consoleMainBuild = await prisma.build.create({
      data: {
        projectId: consoleProject.id,
        commitSha: '9d12f89',
        branch: 'main',
        command: 'pnpm build',
        startedAt: new Date(Date.now() - 1000 * 60 * 10),
        completedAt: new Date(Date.now() - 1000 * 60 * 8),
        status: 'succeeded',
        artifactUrl: 'oci://registry.helix.run/helix-console/main:9d12f89',
      },
    })

    const consolePreviewBuild = await prisma.build.create({
      data: {
        projectId: consoleProject.id,
        commitSha: 'f7abcee',
        branch: 'feature/runtime-api',
        command: 'pnpm build',
        startedAt: new Date(Date.now() - 1000 * 60 * 30),
        completedAt: new Date(Date.now() - 1000 * 60 * 25),
        status: 'succeeded',
        artifactUrl: 'oci://registry.helix.run/helix-console/preview/pr-42:f7abcee',
      },
    })

    const aiDocsBuild = await prisma.build.create({
      data: {
        projectId: aiDocsProject.id,
        commitSha: 'b671221',
        branch: 'main',
        command: 'npm run build',
        startedAt: new Date(Date.now() - 1000 * 60 * 55),
        completedAt: new Date(Date.now() - 1000 * 60 * 47),
        status: 'succeeded',
        artifactUrl: 'oci://registry.helix.run/ai-docs/main:b671221',
      },
    })

    await prisma.deployment.createMany({
      data: [
        {
          projectId: consoleProject.id,
          buildId: consoleMainBuild!.id,
          kind: 'production',
          status: 'ready',
          url: 'https://console.helix.run',
          commitMessage: 'feat: add deployment flow UI',
          author: 'abi@helix.run',
          environment: 'production',
          regionRollout: [
            { region: 'iad', status: 'ready' },
            { region: 'cdg', status: 'ready' },
            { region: 'bom', status: 'ready' },
          ],
        },
        {
          projectId: consoleProject.id,
          buildId: consolePreviewBuild!.id,
          kind: 'preview',
          status: 'ready',
          url: 'https://preview-pr42.console.helix.run',
          commitMessage: 'runtime API hooks',
          author: 'ivy@helix.run',
          environment: 'preview',
          regionRollout: [
            { region: 'iad', status: 'ready' },
            { region: 'sfo', status: 'ready' },
          ],
        },
        {
          projectId: aiDocsProject.id,
          buildId: aiDocsBuild!.id,
          kind: 'production',
          status: 'ready',
          url: 'https://ai-docs.example.com',
          commitMessage: 'chore: regen embeddings',
          author: 'sam@acme.io',
          environment: 'production',
          regionRollout: [
            { region: 'iad', status: 'ready' },
            { region: 'dub', status: 'ready' },
          ],
        },
      ],
    })
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
