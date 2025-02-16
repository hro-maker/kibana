/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { schema, Type, TypeOf } from '@kbn/config-schema';
import {
  CoreQueryParamsSchemaProperties,
  validateCoreQueryBody,
} from '../../../../triggers_actions_ui/server';
import { ComparatorFnNames } from '../lib';
import { Comparator } from '../../../common/comparator_types';

// alert type parameters

export type Params = TypeOf<typeof ParamsSchema>;

export const ParamsSchema = schema.object(
  {
    ...CoreQueryParamsSchemaProperties,
    // the comparison function to use to determine if the threshold as been met
    thresholdComparator: schema.string({ validate: validateComparator }) as Type<Comparator>,
    // the values to use as the threshold; `between` and `notBetween` require
    // two values, the others require one.
    threshold: schema.arrayOf(schema.number(), { minSize: 1, maxSize: 2 }),
  },
  {
    validate: validateParams,
  }
);

const betweenComparators = new Set(['between', 'notBetween']);

// using direct type not allowed, circular reference, so body is typed to any
function validateParams(anyParams: unknown): string | undefined {
  // validate core query parts, return if it fails validation (returning string)
  const coreQueryValidated = validateCoreQueryBody(anyParams);
  if (coreQueryValidated) return coreQueryValidated;

  const { thresholdComparator, threshold }: Params = anyParams as Params;

  if (betweenComparators.has(thresholdComparator) && threshold.length === 1) {
    return i18n.translate('xpack.stackAlerts.indexThreshold.invalidThreshold2ErrorMessage', {
      defaultMessage:
        '[threshold]: must have two elements for the "{thresholdComparator}" comparator',
      values: {
        thresholdComparator,
      },
    });
  }
}

function validateComparator(comparator: string): string | undefined {
  if (ComparatorFnNames.has(comparator as Comparator)) return;

  return i18n.translate('xpack.stackAlerts.indexThreshold.invalidComparatorErrorMessage', {
    defaultMessage: 'invalid thresholdComparator specified: {comparator}',
    values: {
      comparator,
    },
  });
}
