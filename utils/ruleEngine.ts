/**
 * RuleEngine evaluates workflow rules against Purchase Requisition (PR) data.
 */
export class RuleEngine {
  /**
   * Evaluate a single condition expression against PR data.
   * Supported operators: >, <, >=, <=, ==, !=
   */
  static evaluateCondition(condition: any, prData: any): boolean {
    const { field, operator, value } = condition;
    const prValue = prData[field];

    if (prValue === undefined) return false;

    switch (operator) {
      case ">":
        return prValue > value;
      case "<":
        return prValue < value;
      case ">=":
        return prValue >= value;
      case "<=":
        return prValue <= value;
      case "==":
        return prValue === value;
      case "!=":
        return prValue !== value;
      default:
        console.warn(`Unsupported operator: ${operator}`);
        return false;
    }
  }

  /**
   * Evaluate a set of conditions (with optional logic: AND / OR).
   * If no logic specified, default to AND.
   */
  static evaluateConditions(
    conditions: any[],
    prData: any,
    logic: "AND" | "OR" = "AND",
  ): boolean {
    if (logic === "AND") {
      return conditions.every((c) => this.evaluateCondition(c, prData));
    } else {
      return conditions.some((c) => this.evaluateCondition(c, prData));
    }
  }

  /**
   * Determine the next approver(s) based on workflow rules and PR data.
   * Each rule can contain multiple conditions with AND/OR logic.
   */
  static determineNextApprovers(rules: any[], prData: any): string[] {
    const approvers = new Set<string>();

    for (const rule of rules) {
      const conditions =
        rule.conditions || (rule.condition ? [rule.condition] : []);
      const logic = rule.logic || "AND"; // Defaults to AND

      if (this.evaluateConditions(conditions, prData, logic)) {
        approvers.add(rule.approverRole);
      }
    }

    return [...approvers];
  }
}
