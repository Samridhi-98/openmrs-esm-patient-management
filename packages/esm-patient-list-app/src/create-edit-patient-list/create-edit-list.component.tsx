import React, { useCallback, SyntheticEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Layer, OnChangeData, TextArea, TextInput, ButtonSet } from '@carbon/react';
import { useLayoutType, showToast, useSession, isDesktop, useConfig } from '@openmrs/esm-framework';
import { createPatientList, editPatientList } from '../api/api-remote';
import { useCohortTypes } from '../api/hooks';
import { OpenmrsCohort, NewCohortData } from '../api/types';
import Overlay from '../overlay.component';
import styles from './create-edit-patient-list.scss';
import { ConfigSchema } from '../config-schema';

interface CreateEditPatientListProps {
  close: () => void;
  edit?: boolean;
  patientListDetails?: OpenmrsCohort;
  onSuccess?: () => void;
}

const CreateEditPatientList: React.FC<CreateEditPatientListProps> = ({
  close,
  edit = false,
  patientListDetails = null,
  onSuccess = () => {},
}) => {
  const { t } = useTranslation();
  const config = useConfig() as ConfigSchema;
  const session = useSession();
  const [cohortDetails, setCohortDetails] = useState<NewCohortData>({
    name: '',
    description: '',
  });
  const isTablet = useLayoutType() === 'tablet';
  const user = useSession();
  const { data: cohortTypes } = useCohortTypes();

  useEffect(() => {
    setCohortDetails({
      name: patientListDetails?.name || '',
      description: patientListDetails?.description || '',
    });
  }, [user, patientListDetails]);

  const createPL = useCallback(() => {
    // set loading
    if (!edit) {
      createPatientList({
        ...cohortDetails,
        location: session?.sessionLocation?.uuid,
        cohortType: config?.myListCohortTypeUUID,
      })
        .then(() =>
          showToast({
            title: t('successCreatedPatientList', 'Created patient list'),
            description: `${t('successCreatedPatientListDescription', 'Successfully created patient list')} : ${
              cohortDetails?.name
            }`,
            kind: 'success',
          }),
        )
        .then(onSuccess)
        .then(close)
        .catch(() =>
          showToast({
            title: t('error', 'Error'),
            description: `${t('errorCreatePatientListDescription', "Couldn't create patient list")} : ${
              cohortDetails?.name
            }`,
            kind: 'error',
          }),
        );
    } else {
      editPatientList(patientListDetails.uuid, cohortDetails)
        .then(() =>
          showToast({
            title: t('successUpdatePatientList', 'Updated patient list'),
            description: t('successUpdatePatientListDescription', 'Successfully updated patient list'),
            kind: 'success',
          }),
        )
        .then(onSuccess)
        .then(close)
        .catch(() =>
          showToast({
            title: t('error', 'Error'),
            description: `${t('errorUpdatePatientListDescription', "Couldn't update patient list")} : ${
              cohortDetails?.name
            }`,
            kind: 'error',
          }),
        );
    }
  }, [close, user, cohortDetails]);

  const handleChange = useCallback(
    ({ currentTarget }: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCohortDetails((cohortDetails) => ({
        ...cohortDetails,
        [currentTarget?.name]: currentTarget?.value,
      }));
    },
    [setCohortDetails],
  );

  const handleTypeChange = useCallback(
    ({ selectedItem }: OnChangeData) => {
      setCohortDetails((cohortDetails) => ({
        ...cohortDetails,
        cohortType: cohortTypes?.find((type) => type?.display === selectedItem)?.uuid,
      }));
    },
    [setCohortDetails, cohortTypes],
  );

  return (
    <Overlay
      header={!edit ? t('newPatientListHeader', 'New patient list') : t('editPatientListHeader', 'Edit patient list')}
      close={close}
      buttonsGroup={
        <ButtonSet className={styles.buttonsGroup}>
          <Button onClick={close} kind="secondary" size="xl">
            {t('cancel', 'Cancel')}
          </Button>
          <Button onClick={createPL} size="xl">
            {!edit ? t('createList', 'Create list') : t('editList', 'Edit list')}
          </Button>
        </ButtonSet>
      }>
      <h4 className={styles.header}>{t('configureList', 'Configure your patient list using the fields below')}</h4>
      <div>
        <Layer level={isTablet ? 1 : 0}>
          <TextInput
            labelText={t('newPatientListNameLabel', 'List name')}
            placeholder={t('listNamePlaceholder', 'e.g. Potential research participants')}
            id="list_name"
            name="name"
            onChange={handleChange}
            value={cohortDetails?.name}
          />
        </Layer>
      </div>
      <div className={styles.input}>
        <Layer level={isTablet ? 1 : 0}>
          <TextArea
            id="list_description"
            name="description"
            onChange={handleChange}
            placeholder={t(
              'listDescriptionPlaceholder',
              'e.g. Patients with diagnosed asthma who may be willing to be a part of a university research study',
            )}
            labelText={t('newPatientListDescriptionLabel', 'Describe the purpose of this list in a few words')}
            value={cohortDetails?.description}
          />
        </Layer>
      </div>
    </Overlay>
  );
};

export default CreateEditPatientList;
