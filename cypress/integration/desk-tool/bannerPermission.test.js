describe('@sanity/desk-tool: banner permissions on update (existing documents)', () => {
  it('as an administrator user, the permission banner will not be visible (has permissions)', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    cy.get('[data-testid=permission-check-banner]').should('not.exist')
  })

  it('as a restricted user, the permission banner will be visible (does not have permission)', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=restricted'
    )

    cy.get('[data-testid=permission-check-banner]').should('exist')
  })

  it('as a requiresApproval user, the permission banner will be not visible (does have permission) on specific document types', () => {
    cy.visit(
      '/test/desk/author;914bcbf4-9ead-4be1-b797-8d2995c50380%2Ctemplate%3Dauthor-unlocked#_debug_roles=requiresApproval'
    )

    cy.get('[data-testid=permission-check-banner]').should('not.exist')
  })

  it('as a requiresApproval user, the permission banner will be visible (does not have permission) on other documents', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=requiresApproval'
    )

    cy.get('[data-testid=permission-check-banner]').should('exist')
  })
})

describe('@sanity/desk-tool: banner permissions on create', () => {
  /*it('as an administrator user, the permission banner will not be visible (has permissions)', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    cy.get('[data-testid=permission-check-banner]').should('not.exist')
  })

  it('as a restricted user, the permission banner will be visible (does not have permission)', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=restricted'
    )

    cy.get('[data-testid=permission-check-banner]').should('exist')
  })

  it('as a requiresApproval user, the permission banner will be not visible (does have permission) on specific document types', () => {
    cy.visit('/test/desk/author#_debug_roles=requiresApproval')

    cy.get('[data-testid=permission-check-banner]').should('not.exist')
  })*/
})