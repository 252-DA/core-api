import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.courses.upsert({
    where: { code: 'CO2003' },
    create: {
      lms_id: 'demo-canvas-co2003',
      code: 'CO2003',
      name: 'Data Structures and Algorithms',
      description: 'Demo course seeded for the report-aligned lesson flow.',
    },
    update: {
      name: 'Data Structures and Algorithms',
      description: 'Demo course seeded for the report-aligned lesson flow.',
    },
  });

  const chapter = await prisma.chapters.upsert({
    where: { course_id_code: { course_id: course.course_id, code: '1' } },
    create: {
      course_id: course.course_id,
      code: '1',
      title: 'Linear Data Structures',
      sort_order: 1,
    },
    update: { title: 'Linear Data Structures', sort_order: 1 },
  });

  // LO thuộc học phần; chương nào dạy LO nào nằm ở bảng nối chapter_los.
  const lo1 = await prisma.learning_outcomes.upsert({
    where: {
      course_id_code_academic_year_version: {
        course_id: course.course_id,
        code: 'LO.1.1',
        academic_year: '2025-2026',
        version: 1,
      },
    },
    create: {
      course_id: course.course_id,
      code: 'LO.1.1',
      statement_vi: 'Explain the concept and basic operations of linked lists.',
      statement_en: 'Explain the concept and basic operations of linked lists.',
      bloom_level: 2,
      cdio_level: 'I',
      academic_year: '2025-2026',
    },
    update: {
      statement_vi: 'Explain the concept and basic operations of linked lists.',
      statement_en: 'Explain the concept and basic operations of linked lists.',
      bloom_level: 2,
      cdio_level: 'I',
      is_current: true,
    },
  });

  const lo2 = await prisma.learning_outcomes.upsert({
    where: {
      course_id_code_academic_year_version: {
        course_id: course.course_id,
        code: 'LO.1.2',
        academic_year: '2025-2026',
        version: 1,
      },
    },
    create: {
      course_id: course.course_id,
      code: 'LO.1.2',
      statement_vi: 'Apply stacks and queues to solve basic traversal problems.',
      statement_en: 'Apply stacks and queues to solve basic traversal problems.',
      bloom_level: 3,
      cdio_level: 'II',
      academic_year: '2025-2026',
    },
    update: {
      statement_vi: 'Apply stacks and queues to solve basic traversal problems.',
      statement_en: 'Apply stacks and queues to solve basic traversal problems.',
      bloom_level: 3,
      cdio_level: 'II',
      is_current: true,
    },
  });

  for (const lo of [lo1, lo2]) {
    await prisma.chapter_los.upsert({
      where: { chapter_id_lo_id: { chapter_id: chapter.chapter_id, lo_id: lo.lo_id } },
      create: { chapter_id: chapter.chapter_id, lo_id: lo.lo_id },
      update: {},
    });
  }

  const instructor = await prisma.lms_user_mappings.upsert({
    where: {
      lms_type_lms_sub: {
        lms_type: 'canvas',
        lms_sub: 'demo-instructor',
      },
    },
    create: {
      lms_type: 'canvas',
      lms_sub: 'demo-instructor',
      display_name: 'Demo Instructor',
      role: 'instructor',
    },
    update: {
      display_name: 'Demo Instructor',
      role: 'instructor',
      updated_at: new Date(),
    },
  });

  const learner = await prisma.lms_user_mappings.upsert({
    where: {
      lms_type_lms_sub: {
        lms_type: 'canvas',
        lms_sub: 'demo-learner',
      },
    },
    create: {
      lms_type: 'canvas',
      lms_sub: 'demo-learner',
      display_name: 'Demo Learner',
      role: 'learner',
    },
    update: {
      display_name: 'Demo Learner',
      role: 'learner',
      updated_at: new Date(),
    },
  });

  await prisma.course_memberships.upsert({
    where: {
      user_id_course_id_role: {
        user_id: instructor.internal_user_id,
        course_id: course.course_id,
        role: 'instructor',
      },
    },
    create: {
      user_id: instructor.internal_user_id,
      course_id: course.course_id,
      role: 'instructor',
    },
    update: { last_seen_at: new Date() },
  });

  await prisma.course_memberships.upsert({
    where: {
      user_id_course_id_role: {
        user_id: learner.internal_user_id,
        course_id: course.course_id,
        role: 'learner',
      },
    },
    create: {
      user_id: learner.internal_user_id,
      course_id: course.course_id,
      role: 'learner',
    },
    update: { last_seen_at: new Date() },
  });

  await prisma.lessons.upsert({
    where: {
      course_id_lo_id: {
        course_id: course.course_id,
        lo_id: lo1.lo_id,
      },
    },
    create: {
      course_id: course.course_id,
      lo_id: lo1.lo_id,
      title: 'Linked List Essentials',
      status: 'PUBLISHED',
      published_at: new Date(),
    },
    update: {
      title: 'Linked List Essentials',
      status: 'PUBLISHED',
      published_at: new Date(),
    },
  });

  await prisma.lessons.upsert({
    where: {
      course_id_lo_id: {
        course_id: course.course_id,
        lo_id: lo2.lo_id,
      },
    },
    create: {
      course_id: course.course_id,
      lo_id: lo2.lo_id,
      title: 'Stacks and Queues',
      status: 'PUBLISHED',
      published_at: new Date(),
    },
    update: {
      title: 'Stacks and Queues',
      status: 'PUBLISHED',
      published_at: new Date(),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
